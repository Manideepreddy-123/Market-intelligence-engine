import { env } from "@/lib/env";

export type HunterResult = {
  email: string | null;
  score: number | null;
  sources: string[];
  raw: unknown;
};

export async function findEmail(opts: {
  domain: string;
  firstName: string;
  lastName: string;
}): Promise<HunterResult> {
  if (!env.HUNTER_API_KEY) throw new Error("HUNTER_API_KEY missing");
  const params = new URLSearchParams({
    domain: opts.domain,
    first_name: opts.firstName,
    last_name: opts.lastName,
    api_key: env.HUNTER_API_KEY,
  });
  const res = await fetch(
    `https://api.hunter.io/v2/email-finder?${params.toString()}`
  );
  if (!res.ok) throw new Error(`Hunter.io ${res.status}`);
  const data = (await res.json()) as {
    data?: {
      email?: string | null;
      score?: number | null;
      sources?: Array<{ uri?: string }> | null;
    };
  };
  const d = data.data ?? {};
  return {
    email: d.email ?? null,
    score: typeof d.score === "number" ? d.score / 100 : null,
    sources: (d.sources ?? []).map((s) => s.uri ?? "").filter(Boolean),
    raw: data,
  };
}
