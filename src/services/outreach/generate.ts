import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { generateStructured } from "../llm/groq";

const DraftSchema = z.object({
  email: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  linkedin: z.object({
    body: z.string(),
  }),
  references: z.array(z.string()),
});

const SYSTEM = `You write personalized B2B outreach grounded ONLY in the provided intelligence report.

EMAIL STRUCTURE — the body MUST follow this five-part skeleton, delivered as continuous prose without headings or bullets:
1. Opener — why this person at this company specifically. Cite ONE observed signal: a recent campaign, event, hire, or strategic move drawn verbatim from brand_activity.activities, experiential_events.events, or market_position.
2. Pitch — one sentence on the angle, framed against the brand's category and recent activity.
3. Proof — one concrete data point or analogue (a number, a comparable case, a measurable outcome). Use proof, not adjectives.
4. Ask — one specific, low-friction next step (a 15-minute call, an intro to a teammate, sharing a one-pager). Exactly one ask.
5. Sign-off — terse: name placeholder, role, no closing fluff.

LINKEDIN — same opener-pitch-ask compression, conversational register, no headings.

PERSONALIZATION SOURCES — must come from one of:
- a specific item in brand_activity.activities
- a specific item in experiential_events.events
- a specific shift named in market_position.summary
Generic flattery ("loved your work", "huge fan") is forbidden. If you cannot cite a specific signal from the report, say so plainly rather than inventing one.

HARD LIMITS:
- Subject <= 80 chars, specific (not "Quick question").
- Email body <= 180 words.
- LinkedIn body <= 600 chars including spaces.
- No emojis. No "I hope this email finds you well." No "I came across your profile."
- "references" must list URLs that appeared in the report's citations AND that you actually drew on for the personalization.

EMPTY-REPORT FALLBACK — if every section is status:"not_found", produce a brief factual outreach acknowledging that public information is limited and ask one open question. Do not fabricate a campaign or event.`;

export async function generateOutreachForContact(contactId: string) {
  const contact = await db.query.contacts.findFirst({
    where: eq(schema.contacts.id, contactId),
    with: { decisionMaker: { with: { company: true } } },
  });
  if (!contact) throw new Error(`Contact ${contactId} not found`);

  const company = contact.decisionMaker.company;
  const dm = contact.decisionMaker;

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.companyId, company.id),
    orderBy: [desc(schema.reports.version)],
  });
  if (!report)
    throw new Error(
      `No report for company ${company.id} — run report generation first`
    );

  const userPrompt = `Recipient: ${dm.name} (${dm.title ?? dm.role}) at ${company.name}
Company category: ${company.category ?? "(unspecified)"}

Latest intelligence report (JSON):
${JSON.stringify(report.content)}

Write the outreach now.`;

  const parsed = await generateStructured({
    schema: DraftSchema,
    system: SYSTEM,
    user: userPrompt,
    maxTokens: 2000,
  });

  const [emailRow] = await db
    .insert(schema.outreach)
    .values({
      contactId,
      channel: "email",
      subject: parsed.email.subject,
      body: parsed.email.body,
      status: "draft",
    })
    .returning({ id: schema.outreach.id });

  const [linkedinRow] = await db
    .insert(schema.outreach)
    .values({
      contactId,
      channel: "linkedin",
      subject: null,
      body: parsed.linkedin.body,
      status: "draft",
    })
    .returning({ id: schema.outreach.id });

  return {
    emailDraftId: emailRow?.id,
    linkedinDraftId: linkedinRow?.id,
    references: parsed.references,
  };
}
