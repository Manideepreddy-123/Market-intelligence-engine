import { cn } from "@/lib/cn";

const BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "0.5–0.6", min: 0.5, max: 0.6 },
  { label: "0.6–0.7", min: 0.6, max: 0.7 },
  { label: "0.7–0.8", min: 0.7, max: 0.8 },
  { label: "0.8–0.9", min: 0.8, max: 0.9 },
  { label: "0.9–1.0", min: 0.9, max: 1.001 },
];

export function ConfidenceHistogram({
  dms,
}: {
  dms: Array<{ confidence: number | null }>;
}) {
  const counts = BUCKETS.map(
    (b) =>
      dms.filter(
        (d) =>
          typeof d.confidence === "number" &&
          d.confidence >= b.min &&
          d.confidence < b.max
      ).length
  );
  const max = Math.max(1, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="surface px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Decision-maker confidence
        </p>
        <p className="text-xs text-slate-500">
          {total === 0
            ? "No confidence data yet"
            : `${total} ${total === 1 ? "person" : "people"}`}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {BUCKETS.map((b, i) => {
          const n = counts[i] ?? 0;
          const h = (n / max) * 100;
          const isHigh = b.min >= 0.8;
          return (
            <div key={b.label} className="flex flex-col items-center gap-1.5">
              <div className="flex h-20 w-full items-end justify-center rounded-md bg-slate-50 ring-1 ring-inset ring-slate-200/70">
                <div
                  className={cn(
                    "w-full rounded-md transition-[height] duration-500 ease-out",
                    isHigh
                      ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                      : "bg-gradient-to-t from-violet-500 to-violet-400",
                    n === 0 && "opacity-20"
                  )}
                  style={{ height: `${Math.max(h, n > 0 ? 6 : 0)}%` }}
                  title={`${n} ${n === 1 ? "person" : "people"} at ${b.label}`}
                />
              </div>
              <span className="text-[11px] font-medium tabular-nums text-slate-700">
                {n}
              </span>
              <span className="text-[10px] text-slate-400">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
