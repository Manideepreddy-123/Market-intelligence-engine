import { NextResponse } from "next/server";
import { recordClick } from "@/services/tracking";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mid = url.searchParams.get("mid");
  const target = url.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }
  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (parsedTarget.protocol !== "http:" && parsedTarget.protocol !== "https:") {
    return NextResponse.json({ error: "invalid protocol" }, { status: 400 });
  }
  if (mid) {
    const ua = req.headers.get("user-agent") ?? "";
    const ip = req.headers.get("x-forwarded-for") ?? "";
    try {
      await recordClick(mid, target, { ua, ip, ts: new Date().toISOString() });
    } catch (err) {
      console.error("[track/click]", err);
    }
  }
  return NextResponse.redirect(parsedTarget.toString(), 302);
}
