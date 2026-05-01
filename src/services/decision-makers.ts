import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateStructured } from "./llm/groq";
import { tavily } from "./search/tavily";

const ROLES = [
  "CMO",
  "Head of Marketing",
  "Brand Director",
  "Growth Lead",
  "Head of Partnerships",
] as const;

const PeopleSchema = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      role: z.enum(ROLES),
      profile_url: z.string().nullable(),
      source_urls: z.array(z.string()),
      confidence: z.number(),
    })
  ),
});

const SYSTEM = `You extract decision-maker (marketing leadership) people for a company STRICTLY from the provided search results.

RULES:
- Only include people EXPLICITLY named in the snippets.
- Do not guess from generic mentions, job postings, or unrelated companies.
- Each person needs at least one source_url drawn verbatim from the provided results.
- confidence: 1.0 = named in multiple authoritative sources; 0.5 = single source; <0.5 = drop.
- Return an empty array if nothing meets the bar. Never fabricate.

PROFILE URL PREFERENCE:
- When the snippets contain a LinkedIn profile URL for the person (matching linkedin.com/in/...), put that URL in profile_url. This is the preferred value.
- Otherwise, use any other personal/biographical URL (e.g. company team page, personal site).
- Use null when no such URL is present in the snippets. Do not guess or construct LinkedIn URLs.`;

export async function runDecisionMakers(companyId: string) {
  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, companyId),
  });
  if (!company) throw new Error(`Company ${companyId} not found`);

  const allHits: Array<{
    url: string;
    title?: string;
    snippet?: string;
    targetRole: string;
  }> = [];
  for (const role of ROLES) {
    try {
      const hits = await tavily.search(`"${company.name}" "${role}"`, {
        limit: 5,
      });
      for (const h of hits)
        allHits.push({
          url: h.url,
          title: h.title,
          snippet: h.snippet,
          targetRole: role,
        });
    } catch (err) {
      console.error(`[dm] search failed for ${role}`, err);
    }
  }

  if (allHits.length === 0) return { inserted: 0, found: 0 };

  const sourceList = allHits
    .map(
      (h, i) =>
        `[${i + 1}] role-target=${h.targetRole}\n  url=${h.url}\n  ${h.title ?? ""}\n  ${h.snippet ?? ""}`
    )
    .join("\n\n");

  const userPrompt = `Company: ${company.name}
Category: ${company.category ?? "(unspecified)"}

Search results:
${sourceList}

Extract decision-makers now.`;

  const allowedUrls = new Set(allHits.map((h) => h.url));

  const parsed = await generateStructured({
    schema: PeopleSchema,
    system: SYSTEM,
    user: userPrompt,
    maxTokens: 4000,
  });

  const eligible = parsed.people.filter(
    (p) =>
      p.confidence >= 0.5 && p.source_urls.some((u) => allowedUrls.has(u))
  );
  if (eligible.length === 0)
    return { inserted: 0, found: parsed.people.length };

  const rows = eligible.map((p) => ({
    companyId,
    name: p.name,
    title: p.title,
    role: p.role,
    profileUrl: p.profile_url ?? null,
    sourceUrls: p.source_urls.filter((u) => allowedUrls.has(u)),
    confidence: p.confidence,
  }));

  const inserted = await db
    .insert(schema.decisionMakers)
    .values(rows)
    .onConflictDoNothing({
      target: [
        schema.decisionMakers.companyId,
        schema.decisionMakers.name,
        schema.decisionMakers.role,
      ],
    })
    .returning({ id: schema.decisionMakers.id });

  return { inserted: inserted.length, found: parsed.people.length };
}
