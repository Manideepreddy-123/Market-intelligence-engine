import { env } from "@/lib/env";

const ENDPOINT = "https://api.firecrawl.dev/v1/scrape";

export async function firecrawlScrape(url: string): Promise<string | null> {
  if (!env.FIRECRAWL_API_KEY) throw new Error("Missing FIRECRAWL_API_KEY: This feature requires Firecrawl for deep scraping. Please configure it in Vercel.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 25_000,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      success?: boolean;
      data?: { markdown?: string };
    };
    return data.data?.markdown ?? null;
  } finally {
    clearTimeout(timer);
  }
}
