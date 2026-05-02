import { env } from "@/lib/env";
import type { SearchHit, SearchProvider } from "./types";

const ENDPOINT = "https://api.tavily.com/search";

export const tavily: SearchProvider = {
  async search(query, { limit = 15, tbm = null } = {}) {
    if (!env.TAVILY_API_KEY) throw new Error("Missing TAVILY_API_KEY: This feature requires Tavily for web search. Please configure it in Vercel.");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        max_results: Math.min(limit, 20),
        topic: tbm === "nws" ? "news" : "general",
        include_answer: false,
        search_depth: "basic",
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Tavily ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      results?: Array<{
        url: string;
        title?: string;
        content?: string;
        published_date?: string;
        score?: number;
      }>;
    };
    const sourceType = tbm === "nws" ? "news" : "website";
    const hits: SearchHit[] = [];
    for (const r of data.results ?? []) {
      if (!r.url) continue;
      const publishedAt = r.published_date ? new Date(r.published_date) : undefined;
      hits.push({
        url: r.url,
        title: r.title,
        snippet: r.content,
        publishedAt:
          publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : undefined,
        sourceType,
        raw: r,
      });
    }
    return hits;
  },
};
