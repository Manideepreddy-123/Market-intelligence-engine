import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  domain: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [row] = await db
    .insert(schema.companies)
    .values(parsed.data)
    .returning();
  return NextResponse.json(row, { status: 201 });
}
