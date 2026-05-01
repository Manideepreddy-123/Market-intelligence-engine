import { db, schema } from "@/db";
import { eq, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { generateStructured, REPORT_MODEL } from "./llm/groq";

const Section = z.object({
  status: z.enum(["found", "not_found"]),
  summary: z.string(),
  citations: z.array(z.string()),
});

const Competitor = z.object({
  name: z.string(),
  current_activity: z.string(),
  strengths_and_gaps: z.string(),
  citations: z.array(z.string()),
});

const Activity = z.object({
  title: z.string(),
  date: z.string().nullable(),
  summary: z.string(),
  citations: z.array(z.string()),
});

const EventEntry = z.object({
  title: z.string(),
  date: z.string().nullable(),
  format: z.string(),
  scale: z.string(),
  outcomes: z.string(),
  citations: z.array(z.string()),
});

const Watchout = z.object({
  issue: z.string(),
  impact: z.string(),
  citations: z.array(z.string()),
});

export const ReportSchema = z.object({
  company_overview: Section,
  market_position: Section,
  competitor_mapping: z.object({
    status: z.enum(["found", "not_found"]),
    competitors: z.array(Competitor),
  }),
  brand_activity: z.object({
    status: z.enum(["found", "not_found"]),
    activities: z.array(Activity),
  }),
  experiential_events: z.object({
    status: z.enum(["found", "not_found"]),
    events: z.array(EventEntry),
  }),
  strategic_watchouts: z.object({
    status: z.enum(["found", "not_found"]),
    items: z.array(Watchout),
  }),
});

export type Report = z.infer<typeof ReportSchema>;

const SYSTEM_PROMPT = `You are a market intelligence analyst. Produce a structured JSON report about a company using ONLY the provided sources.

HARD RULES (anti-fabrication — do not relax):
1. NEVER invent facts, quotes, names, or dates. Every claim must trace to a source in the provided list.
2. Citations MUST be exact URLs that appear verbatim in the provided sources list. Do not invent or paraphrase URLs.
3. Do not invent competitor names, campaigns, or events that are not at least mentioned in a source's snippet or body.

RECALL RULES (populate aggressively from what's there):
4. Aim to populate every section. "status": "not_found" is reserved for the case where NO provided source mentions anything relevant to the section — not for the case where evidence is thin.
5. Snippet-only evidence is sufficient to:
   - name a competitor (use snippet content for current_activity / strengths_and_gaps; cite the snippet's URL),
   - record a brand activity or event (use snippet content for the summary / format / scale / outcomes; cite the URL),
   - flag a strategic watchout.
   Where a field cannot be filled from the sources, write a short honest placeholder (e.g. "scale not disclosed", "no public outcome reported") rather than dropping the entry.
6. Sources tagged sourceType="competitor" are the primary feed for competitor_mapping. Aim for 3-5 distinct competitors when at least one such source mentions a name.
7. Sources tagged sourceType="event" are the primary feed for experiential_events. Lift event titles, formats, and scale from these; do not require a separate "outcomes" source to record the event.
8. ANY source whose snippet or body mentions controversy, backlash, lawsuit, layoffs, criticism, decline, regulatory action, scandal, or strategic risk feeds strategic_watchouts — regardless of its sourceType tag.
9. Prefer recent sources for brand_activity and experiential_events when source dates are available; do not exclude older items if no recent ones exist.

ANALYTIC DISCIPLINE:
10. Separate fact from inference. Statements directly supported by a source are facts; reading between the lines is inference. When you make a non-trivial inference, prefix that sentence with "Inference:" inside the summary.
11. Flag stale evidence. If the most recent supporting source for a claim is older than 12 months (relative to the source's publishedAt date when shown, otherwise treat as undated), append "[stale]" at the end of that claim.
12. Translate findings into a decision angle. The market_position summary and each strategic_watchouts.items[].impact MUST end with a one-sentence implication for someone preparing to engage this brand.

FIELD-LEVEL GUIDANCE:
13. Competitor: current_activity = what the competitor is doing now (campaigns, product moves, hires, market entries) drawn from the sources. strengths_and_gaps = relative positioning vs the target company — where they are stronger and where the target has an opening. If the source only names the competitor without detail, write "named in source; no detail provided" for the missing field rather than dropping the entry.
14. Event entry: format = the activation type (e.g. "in-person flagship activation", "hybrid summit", "experiential pop-up", "product launch event"). scale = numeric reach if stated (cities, attendees, impressions), otherwise "scale not disclosed". outcomes = measured/reported impact — sales lift, earned media, awards, partnerships — or "no public outcome reported" if none.
15. Strategic watchout: issue = the risk in one phrase. impact = why it matters for someone preparing to engage the brand (ends with the decision-angle sentence per rule 12).`;

const MAX_SOURCES = 10;
const RESERVED_COMPETITOR = 2;
const RESERVED_EVENT = 2;
const PER_SOURCE_BODY_CHARS = 750;
const SNIPPET_FALLBACK_CHARS = 400;

function trim(s: string | null | undefined, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

type SourceRow = typeof schema.researchSources.$inferSelect;

function pickSources(all: SourceRow[]): SourceRow[] {
  const picked: SourceRow[] = [];
  const seen = new Set<string>();
  const take = (row: SourceRow) => {
    if (seen.has(row.url)) return;
    seen.add(row.url);
    picked.push(row);
  };
  for (const row of all.filter((r) => r.sourceType === "competitor").slice(0, RESERVED_COMPETITOR)) {
    take(row);
  }
  for (const row of all.filter((r) => r.sourceType === "event").slice(0, RESERVED_EVENT)) {
    take(row);
  }
  for (const row of all) {
    if (picked.length >= MAX_SOURCES) break;
    take(row);
  }
  return picked.slice(0, MAX_SOURCES);
}

export async function generateReport(companyId: string): Promise<{
  reportId: string;
  version: number;
}> {
  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, companyId),
  });
  if (!company) throw new Error(`Company ${companyId} not found`);

  const allSources = await db.query.researchSources.findMany({
    where: eq(schema.researchSources.companyId, companyId),
    orderBy: [
      desc(schema.researchSources.publishedAt),
      asc(schema.researchSources.createdAt),
    ],
  });

  if (allSources.length === 0) {
    throw new Error(`No research sources for company ${companyId}. Run research first.`);
  }

  // Section-aware source picking: reserve slots for the weakest-yielding sections
  // (competitor + event) so they aren't crowded out by news/campaign sources.
  const sources = pickSources(allSources);

  const sourceLines = sources
    .map((s, i) => {
      const date = s.publishedAt ? s.publishedAt.toISOString().slice(0, 10) : "n/a";
      const body = s.content
        ? trim(s.content, PER_SOURCE_BODY_CHARS)
        : trim(s.snippet, SNIPPET_FALLBACK_CHARS);
      return `[${i + 1}] (${s.sourceType}, ${date}) ${s.url}\n    ${trim(
        s.title,
        160
      )}\n    ${body}`;
    })
    .join("\n\n");

  const userPrompt = `Company: ${company.name}
Category: ${company.category ?? "(unspecified)"}
Domain: ${company.domain ?? "(unknown)"}

Sources (cite ONLY these URLs):
${sourceLines}

Produce the JSON report now.`;

  const parsed = await generateStructured({
    schema: ReportSchema,
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 4500,
  });

  const allowedUrls = new Set(sources.map((s) => s.url));
  const citations = collectCitations(parsed).filter((u) => allowedUrls.has(u));

  const latest = await db.query.reports.findFirst({
    where: eq(schema.reports.companyId, companyId),
    orderBy: [desc(schema.reports.version)],
  });
  const version = (latest?.version ?? 0) + 1;

  const [row] = await db
    .insert(schema.reports)
    .values({
      companyId,
      version,
      content: parsed,
      citations,
      model: REPORT_MODEL,
    })
    .returning({ id: schema.reports.id });

  if (!row) throw new Error("Failed to insert report");
  return { reportId: row.id, version };
}

function collectCitations(r: Report): string[] {
  const urls = new Set<string>();
  const push = (arr?: string[]) => arr?.forEach((u) => urls.add(u));
  push(r.company_overview.citations);
  push(r.market_position.citations);
  r.competitor_mapping.competitors.forEach((c) => push(c.citations));
  r.brand_activity.activities.forEach((a) => push(a.citations));
  r.experiential_events.events.forEach((e) => push(e.citations));
  r.strategic_watchouts.items.forEach((w) => push(w.citations));
  return Array.from(urls);
}
