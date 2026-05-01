import { cn } from "@/lib/cn";

type SourceType =
  | "website"
  | "news"
  | "campaign"
  | "event"
  | "competitor"
  | "other";

const ORDER: SourceType[] = [
  "website",
  "news",
  "campaign",
  "event",
  "competitor",
  "other",
];

const COLOR: Record<SourceType, string> = {
  website: "bg-slate-400",
  news: "bg-sky-500",
  campaign: "bg-fuchsia-500",
  event: "bg-emerald-500",
  competitor: "bg-violet-500",
  other: "bg-amber-500",
};

const LABEL: Record<SourceType, string> = {
  website: "Website",
  news: "News",
  campaign: "Campaign",
  event: "Event",
  competitor: "Competitor",
  other: "Other",
};

export function SourceMixBar({
  counts,
  className,
}: {
  counts: Partial<Record<SourceType, number>>;
  className?: string;
}) {
  const total = ORDER.reduce((sum, t) => sum + (counts[t] ?? 0), 0);

  if (total === 0) {
    return (
      <div className={cn("text-xs text-slate-400", className)}>
        No source-type data for this report yet.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Source mix
        </p>
        <p className="text-xs tabular-nums text-slate-500">
          {total} {total === 1 ? "source" : "sources"}
        </p>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
        {ORDER.map((t) => {
          const n = counts[t] ?? 0;
          if (n === 0) return null;
          const pct = (n / total) * 100;
          return (
            <span
              key={t}
              className={cn("h-full", COLOR[t])}
              style={{ width: `${pct}%` }}
              title={`${LABEL[t]}: ${n}`}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        {ORDER.filter((t) => (counts[t] ?? 0) > 0).map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-sm", COLOR[t])} />
            <span className="font-medium">{LABEL[t]}</span>
            <span className="tabular-nums text-slate-400">
              {counts[t] ?? 0}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
