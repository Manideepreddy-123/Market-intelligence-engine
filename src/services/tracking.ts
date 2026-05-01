import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { verify } from "@/lib/signed-id";

const STATUS_RANK: Record<string, number> = {
  draft: 0,
  queued: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  replied: 6,
  bounced: 7,
  failed: 7,
};

type OutreachStatus =
  | "draft"
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced"
  | "failed";

async function bumpStatus(outreachId: string, target: OutreachStatus) {
  const row = await db.query.outreach.findFirst({
    where: eq(schema.outreach.id, outreachId),
  });
  if (!row) return;
  const cur = STATUS_RANK[row.status] ?? 0;
  const nx = STATUS_RANK[target] ?? 0;
  if (nx > cur) {
    await db
      .update(schema.outreach)
      .set({ status: target })
      .where(eq(schema.outreach.id, outreachId));
  }
}

export async function recordOpen(
  signedMid: string,
  meta: Record<string, unknown>
) {
  const outreachId = verify(signedMid);
  if (!outreachId) return;
  await db.insert(schema.events).values({
    outreachId,
    eventType: "open",
    payload: meta,
  });
  await bumpStatus(outreachId, "opened");
}

export async function recordClick(
  signedMid: string,
  url: string,
  meta: Record<string, unknown>
) {
  const outreachId = verify(signedMid);
  if (!outreachId) return;
  await db.insert(schema.events).values({
    outreachId,
    eventType: "click",
    payload: { ...meta, url },
  });
  await bumpStatus(outreachId, "clicked");
}

export async function recordProviderEvent(
  providerMessageId: string,
  eventType: "delivery" | "open" | "click" | "reply" | "bounce" | "complaint",
  payload: unknown
) {
  const outreach = await db.query.outreach.findFirst({
    where: eq(schema.outreach.providerMessageId, providerMessageId),
  });
  if (!outreach) return null;
  await db.insert(schema.events).values({
    outreachId: outreach.id,
    eventType,
    payload: payload as Record<string, unknown>,
  });
  const map: Partial<Record<typeof eventType, OutreachStatus>> = {
    delivery: "delivered",
    open: "opened",
    click: "clicked",
    reply: "replied",
    bounce: "bounced",
    complaint: "bounced",
  };
  const target = map[eventType];
  if (target) await bumpStatus(outreach.id, target);
  return outreach.id;
}
