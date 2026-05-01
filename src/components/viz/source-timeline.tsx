import { cn } from "@/lib/cn";

type SourceType =
  | "website"
  | "news"
  | "campaign"
  | "event"
  | "competitor"
  | "other";

const COLOR: Record<SourceType, string> = {
  website: "fill-slate-400",
  news: "fill-sky-500",
  campaign: "fill-fuchsia-500",
  event: "fill-emerald-500",
  competitor: "fill-violet-500",
  other: "fill-amber-500",
};

const STROKE: Record<SourceType, string> = {
  website: "stroke-slate-500",
  news: "stroke-sky-600",
  campaign: "stroke-fuchsia-600",
  event: "stroke-emerald-600",
  competitor: "stroke-violet-600",
  other: "stroke-amber-600",
};

export type TimelinePoint = {
  url: string;
  publishedAt: Date | null;
  sourceType: SourceType;
  title?: string | null;
};

export function SourceTimeline({
  points,
  className,
}: {
  points: TimelinePoint[];
  className?: string;
}) {
  const dated = points.filter((p) => p.publishedAt);
  const undatedCount = points.length - dated.length;

  if (dated.length === 0) {
    return (
      <div className={cn("text-xs text-slate-400", className)}>
        No dated sources to plot.
      </div>
    );
  }

  // X-axis: span from min(dates) to max(dates), with 5% padding.
  const times = dated.map((p) => p.publishedAt!.getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const range = Math.max(max - min, 1);
  const padded = range * 0.05;
  const xMin = min - padded;
  const xMax = max + padded;
  const totalRange = xMax - xMin;

  const monthsSpan = (max - min) / (1000 * 60 * 60 * 24 * 30);

  // Tick marks: 4 evenly spaced labels along the axis.
  const ticks = Array.from({ length: 4 }).map((_, i) => {
    const t = xMin + (i / 3) * totalRange;
    return new Date(t).toISOString().slice(0, 7); // YYYY-MM
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Source recency
        </p>
        <p className="text-xs text-slate-500">
          {dated.length} dated · spans{" "}
          {monthsSpan < 1
            ? "<1 month"
            : monthsSpan < 12
              ? `${Math.round(monthsSpan)} mo`
              : `${(monthsSpan / 12).toFixed(1)} yr`}
          {undatedCount > 0 ? ` · ${undatedCount} undated` : ""}
        </p>
      </div>

      <svg
        viewBox="0 0 100 18"
        preserveAspectRatio="none"
        className="h-12 w-full"
        role="img"
        aria-label="Source publication dates timeline"
      >
        {/* axis line */}
        <line x1="0" y1="9" x2="100" y2="9" className="stroke-slate-200" strokeWidth="0.3" />
        {/* tick marks */}
        {Array.from({ length: 4 }).map((_, i) => {
          const x = (i / 3) * 100;
          return (
            <line
              key={i}
              x1={x}
              y1="7"
              x2={x}
              y2="11"
              className="stroke-slate-300"
              strokeWidth="0.3"
            />
          );
        })}
        {/* dots */}
        {dated.map((p, i) => {
          const x = ((p.publishedAt!.getTime() - xMin) / totalRange) * 100;
          // jitter Y so overlapping dates don't perfectly overlap
          const jitter = ((i * 37) % 100) / 100; // 0–1
          const y = 9 + (jitter > 0.5 ? -1 : 1) * (jitter * 4);
          return (
            <circle
              key={p.url + i}
              cx={x}
              cy={y}
              r="1.4"
              className={cn(COLOR[p.sourceType], STROKE[p.sourceType])}
              strokeWidth="0.3"
            >
              <title>
                {(p.title ?? p.url).slice(0, 80)} —{" "}
                {p.publishedAt!.toISOString().slice(0, 10)} ({p.sourceType})
              </title>
            </circle>
          );
        })}
      </svg>

      <div className="flex justify-between text-[10px] tabular-nums text-slate-400">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}
