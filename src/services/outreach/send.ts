import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { sign } from "@/lib/signed-id";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(body: string, mid: string): string {
  const appUrl = env.APP_URL.replace(/\/$/, "");
  const URL_RE = /(https?:\/\/[^\s<]+)/g;
  const parts = body.split(URL_RE);
  const html = parts
    .map((p, i) => {
      const isUrl = i % 2 === 1;
      if (!isUrl) return escapeHtml(p).replace(/\n/g, "<br/>");
      const tracked = `${appUrl}/api/track/click?mid=${encodeURIComponent(mid)}&url=${encodeURIComponent(p)}`;
      return `<a href="${tracked}">${escapeHtml(p)}</a>`;
    })
    .join("");
  const pixel = `<img src="${appUrl}/api/track/open?mid=${encodeURIComponent(mid)}" width="1" height="1" alt="" style="display:block" />`;
  return html + pixel;
}

export async function sendOutreach(outreachId: string) {
  const outreach = await db.query.outreach.findFirst({
    where: eq(schema.outreach.id, outreachId),
    with: { contact: true },
  });
  if (!outreach) throw new Error(`Outreach ${outreachId} not found`);
  if (outreach.channel !== "email") {
    throw new Error(`Send not implemented for channel ${outreach.channel}`);
  }
  if (outreach.status !== "draft") {
    throw new Error(`Outreach ${outreachId} already ${outreach.status}`);
  }
  const to = outreach.contact.email;
  if (!to || outreach.contact.emailStatus === "unavailable") {
    throw new Error(`Contact has no usable email`);
  }
  if (!env.BREVO_API_KEY) throw new Error("BREVO_API_KEY missing");
  if (!env.FROM_EMAIL) throw new Error("FROM_EMAIL missing");

  const mid = sign(outreach.id);
  const html = buildHtml(outreach.body, mid);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.FROM_EMAIL },
      to: [{ email: to }],
      subject: outreach.subject ?? "(no subject)",
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    await db
      .update(schema.outreach)
      .set({ status: "failed" })
      .where(eq(schema.outreach.id, outreachId));
    throw new Error(`Brevo ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { messageId?: string };

  await db
    .update(schema.outreach)
    .set({
      status: "sent",
      messageId: mid,
      providerMessageId: data.messageId ?? null,
      sentAt: new Date(),
    })
    .where(eq(schema.outreach.id, outreachId));

  return { messageId: mid, providerMessageId: data.messageId ?? null };
}
