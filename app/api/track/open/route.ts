import { NextResponse } from "next/server";
import { recordOpen } from "@/services/tracking";

export const runtime = "nodejs";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mid = url.searchParams.get("mid");
  if (mid) {
    const ua = req.headers.get("user-agent") ?? "";
    const ip = req.headers.get("x-forwarded-for") ?? "";
    try {
      await recordOpen(mid, { ua, ip, ts: new Date().toISOString() });
    } catch (err) {
      console.error("[track/open]", err);
    }
  }
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
