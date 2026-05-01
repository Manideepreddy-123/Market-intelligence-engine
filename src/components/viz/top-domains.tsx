import { cn } from "@/lib/cn";

function safeHost(u: string): string {
  try {
    const h = new URL(u).hostname;
    return h.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export function TopDomains({
  urls,
  limit = 5,
}: {
  urls: string[];
  limit?: number;
}) {
  if (urls.length === 0) {
    return (
      <div className="text-xs text-slate-400">
        No citations to rank yet.
      </div>
    );
  }
  const counts = new Map<string, number>();
  for (const u of urls) {
    const h = safeHost(u);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const max = ranked[0]?.[1] ?? 1;
  const uniqueHosts = counts.size;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Top cited domains
        </p>
        <p className="text-xs text-slate-500">
          {uniqueHosts} unique
        </p>
      </div>
      <ul className="space-y-1.5">
        {ranked.map(([host, n], i) => {
          const pct = (n / max) * 100;
          return (
            <li
              key={host}
              className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
            >
              <div className="relative h-5 overflow-hidden rounded-md bg-slate-50 ring-1 ring-inset ring-slate-200/70">
                <div
                  className={cn(
                    "h-full rounded-md transition-[width] duration-500 ease-out",
                    i === 0
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500"
                      : "bg-gradient-to-r from-violet-300 to-violet-200"
                  )}
                  style={{ width: `${Math.max(pct, 6)}%` }}
                />
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center font-medium text-slate-700">
                  {host}
                </span>
              </div>
              <span className="tabular-nums text-slate-600">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
