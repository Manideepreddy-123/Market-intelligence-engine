import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOutreach } from "@/services/outreach/send";

export const runtime = "nodejs";

const Body = z.object({ outreachId: z.string().uuid() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const r = await sendOutreach(parsed.data.outreachId);
    return NextResponse.json(r);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
