import { env } from "@/lib/env";

export async function jinaScrape(url: string): Promise<string | null> {
  const target = `https://r.jina.ai/${url}`;
  const headers: Record<string, string> = { Accept: "text/markdown" };
  if (env.JINA_API_KEY) {
    headers.Authorization = `Bearer ${env.JINA_API_KEY}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(target, { headers, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Jina ${res.status}`);
    }
    const text = await res.text();
    return text.length > 0 ? text : null;
  } finally {
    clearTimeout(timer);
  }
}
