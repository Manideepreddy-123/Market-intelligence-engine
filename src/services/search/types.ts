export type SearchHit = {
  url: string;
  title?: string;
  snippet?: string;
  publishedAt?: Date;
  sourceType?: "website" | "news" | "campaign" | "competitor" | "event" | "other";
  raw?: unknown;
};

export interface SearchProvider {
  search(query: string, opts?: { limit?: number; tbm?: "nws" | null }): Promise<SearchHit[]>;
}
