import { NextResponse } from "next/server";
import { z } from "zod";
import { runResearch } from "@/services/research";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  companyId: z.string().uuid(),
  perQueryLimit: z.number().int().min(1).max(10).optional(),
  totalLimit: z.number().int().min(1).max(40).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await runResearch(parsed.data.companyId, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
