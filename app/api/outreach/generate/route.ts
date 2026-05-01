import { NextResponse } from "next/server";
import { z } from "zod";
import { generateOutreachForContact } from "@/services/outreach/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ contactId: z.string().uuid() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await generateOutreachForContact(parsed.data.contactId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
