import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { tavily } from "./search/tavily";
import type { SearchHit, SearchProvider } from "./search/types";
import { scrapeUrl } from "./scraping";
import { pMap } from "@/lib/p-map";

type QuerySpec = {
  q: string;
  tbm: "nws" | null;
  type: "website" | "news" | "campaign" | "event" | "competitor";
};

const QUERIES = (name: string, category?: string | null): QuerySpec[] => [
  // company overview / market position
  { q: `"${name}" official site`, tbm: null, type: "website" },
  { q: `"${name}" ${category ?? ""} news`, tbm: "nws", type: "news" },
  // brand activity
  { q: `"${name}" marketing campaign`, tbm: null, type: "campaign" },
  // experiential & events — two angles for better recall
  { q: `"${name}" event sponsorship`, tbm: null, type: "event" },
  { q: `"${name}" experiential activation OR pop-up`, tbm: null, type: "event" },
  // competitors — three angles; "vs" and "alternatives" yield far cleaner sources than the bare "competitors" listicles
  { q: `"${name}" vs competitors`, tbm: null, type: "competitor" },
  { q: `"${name}" alternatives`, tbm: null, type: "competitor" },
  // strategic watchouts — risk-flavoured news that the report can pull as watchouts
  { q: `"${name}" controversy OR backlash`, tbm: "nws", type: "news" },
  { q: `"${name}" lawsuit OR criticism OR layoffs`, tbm: "nws", type: "news" },
];

function dedupeByUrl(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    if (seen.has(h.url)) continue;
    seen.add(h.url);
    out.push(h);
  }
  return out;
}

const SCRAPE_CONCURRENCY = 4;
const MAX_CONTENT_CHARS = 8000;

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

export async function runResearch(
  companyId: string,
  opts: {
    provider?: SearchProvider;
    perQueryLimit?: number;
    totalLimit?: number;
    scrape?: boolean;
  } = {}
) {
  const provider = opts.provider ?? tavily;
  const perQueryLimit = opts.perQueryLimit ?? 4;
  const totalLimit = opts.totalLimit ?? 28;
  const scrape = opts.scrape ?? true;

  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, companyId),
  });
  if (!company) throw new Error(`Company ${companyId} not found`);

  const all: SearchHit[] = [];
  for (const { q, tbm, type } of QUERIES(company.name, company.category)) {
    try {
      const hits = await provider.search(q, { limit: perQueryLimit, tbm });
      for (const h of hits) all.push({ ...h, sourceType: h.sourceType ?? type });
    } catch (err) {
      console.error(`[research] query failed: ${q}`, err);
    }
  }

  const unique = dedupeByUrl(all).slice(0, totalLimit);
  if (unique.length === 0) return { inserted: 0, skipped: 0, scraped: 0 };

  let scraped = 0;
  const enriched: Array<SearchHit & { content?: string; contentProvider?: string }> = unique;
  if (scrape) {
    const scrapeResults = await pMap(
      unique,
      async (hit) => scrapeUrl(hit.url),
      SCRAPE_CONCURRENCY
    );
    for (let i = 0; i < unique.length; i++) {
      const r = scrapeResults[i];
      if (r && r.status === "fulfilled" && r.value) {
        const target = enriched[i]!;
        target.content = truncate(r.value.content, MAX_CONTENT_CHARS);
        target.contentProvider = r.value.provider;
        scraped++;
      }
    }
  }

  const rows = enriched.map((h) => ({
    companyId,
    url: h.url,
    title: h.title ?? null,
    snippet: h.snippet ?? null,
    content: h.content ?? null,
    contentProvider: h.contentProvider ?? null,
    publishedAt: h.publishedAt ?? null,
    sourceType: h.sourceType ?? "other",
    raw: h.raw ?? null,
  }));

  const inserted = await db
    .insert(schema.researchSources)
    .values(rows)
    .onConflictDoNothing({
      target: [schema.researchSources.companyId, schema.researchSources.url],
    })
    .returning({ id: schema.researchSources.id });

  return {
    inserted: inserted.length,
    skipped: rows.length - inserted.length,
    scraped,
  };
}
