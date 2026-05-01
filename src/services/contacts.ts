import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { findEmail } from "./enrichment/hunter";

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function enrichContactsForCompany(companyId: string) {
  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, companyId),
  });
  if (!company) throw new Error(`Company ${companyId} not found`);
  if (!company.domain) {
    throw new Error(
      `Company ${companyId} has no domain — set company.domain before enrichment`
    );
  }

  const dms = await db.query.decisionMakers.findMany({
    where: eq(schema.decisionMakers.companyId, companyId),
  });
  if (dms.length === 0)
    return { processed: 0, verified: 0, unverified: 0, unavailable: 0 };

  let verified = 0;
  let unverified = 0;
  let unavailable = 0;

  for (const dm of dms) {
    const { first, last } = splitName(dm.name);
    if (!first || !last) {
      unavailable++;
      await db
        .insert(schema.contacts)
        .values({
          decisionMakerId: dm.id,
          email: null,
          emailStatus: "unavailable",
          confidence: null,
          provider: "hunter",
          raw: { reason: "incomplete name" },
        })
        .onConflictDoNothing();
      continue;
    }
    try {
      const r = await findEmail({
        domain: company.domain,
        firstName: first,
        lastName: last,
      });
      const status: "verified" | "unverified" | "unavailable" =
        r.email && (r.score ?? 0) >= 0.7
          ? "verified"
          : r.email
            ? "unverified"
            : "unavailable";
      if (status === "verified") verified++;
      else if (status === "unverified") unverified++;
      else unavailable++;
      await db
        .insert(schema.contacts)
        .values({
          decisionMakerId: dm.id,
          email: r.email,
          emailStatus: status,
          confidence: r.score,
          provider: "hunter",
          raw: r.raw,
        })
        .onConflictDoNothing({ target: [schema.contacts.email] });
    } catch (err) {
      console.error(`[contacts] hunter failed for ${dm.name}`, err);
      unavailable++;
      await db
        .insert(schema.contacts)
        .values({
          decisionMakerId: dm.id,
          email: null,
          emailStatus: "unavailable",
          confidence: null,
          provider: "hunter",
          raw: { error: err instanceof Error ? err.message : String(err) },
        })
        .onConflictDoNothing();
    }
  }
  return { processed: dms.length, verified, unverified, unavailable };
}
