import { NextResponse } from "next/server";
import { recordProviderEvent } from "@/services/tracking";

export const runtime = "nodejs";

const BREVO_TO_EVENT: Record<
  string,
  "delivery" | "open" | "click" | "reply" | "bounce" | "complaint"
> = {
  delivered: "delivery",
  request: "delivery",
  opened: "open",
  unique_opened: "open",
  proxy_open: "open",
  proxyOpen: "open",
  loadedByProxy: "open",
  click: "click",
  hardBounce: "bounce",
  hard_bounce: "bounce",
  softBounce: "bounce",
  soft_bounce: "bounce",
  blocked: "bounce",
  spam: "complaint",
  complaint: "complaint",
  replied: "reply",
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | (Record<string, unknown> & {
        event?: string;
        "message-id"?: string;
        messageId?: string;
      })
    | null;
  if (!body || !body.event) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const eventType = BREVO_TO_EVENT[body.event];
  if (!eventType) return NextResponse.json({ ignored: body.event });

  const providerMessageId = body["message-id"] ?? body.messageId;
  if (!providerMessageId || typeof providerMessageId !== "string") {
    return NextResponse.json({ error: "missing message-id" }, { status: 400 });
  }

  const matched = await recordProviderEvent(providerMessageId, eventType, body);
  return NextResponse.json({ ok: true, matched: matched ?? null });
}
