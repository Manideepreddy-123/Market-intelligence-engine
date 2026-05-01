import { env } from "@/lib/env";
import { firecrawlScrape } from "./firecrawl";
import { jinaScrape } from "./jina";

export type ScrapeResult = {
  content: string;
  provider: "firecrawl" | "jina";
};

export async function scrapeUrl(url: string): Promise<ScrapeResult | null> {
  if (env.FIRECRAWL_API_KEY) {
    try {
      const content = await firecrawlScrape(url);
      if (content && content.trim().length > 0) {
        return { content, provider: "firecrawl" };
      }
    } catch (err) {
      console.warn(
        `[scrape] firecrawl failed for ${url}: ${err instanceof Error ? err.message : err}`
      );
    }
  }
  try {
    const content = await jinaScrape(url);
    if (content && content.trim().length > 0) {
      return { content, provider: "jina" };
    }
  } catch (err) {
    console.error(
      `[scrape] jina failed for ${url}: ${err instanceof Error ? err.message : err}`
    );
  }
  return null;
}
