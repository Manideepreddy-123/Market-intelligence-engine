import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReport } from "@/services/intelligence";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({ companyId: z.string().uuid() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await generateReport(parsed.data.companyId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
