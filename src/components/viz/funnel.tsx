import { cn } from "@/lib/cn";

type Totals = {
  sent: number;
  delivered?: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
};

const STAGES: Array<{
  key: keyof Totals;
  label: string;
  fill: string;
  ring: string;
}> = [
  { key: "sent", label: "Sent", fill: "bg-slate-700", ring: "ring-slate-300" },
  {
    key: "delivered",
    label: "Delivered",
    fill: "bg-sky-600",
    ring: "ring-sky-200",
  },
  {
    key: "opened",
    label: "Opened",
    fill: "bg-violet-500",
    ring: "ring-violet-200",
  },
  {
    key: "clicked",
    label: "Clicked",
    fill: "bg-fuchsia-500",
    ring: "ring-fuchsia-200",
  },
  {
    key: "replied",
    label: "Replied",
    fill: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
];

export function EngagementFunnel({ totals }: { totals: Totals }) {
  const sent = totals.sent || 0;
  const empty = sent === 0;

  return (
    <div className="surface px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Engagement funnel
        </p>
        <p className="text-xs text-slate-500">
          {empty
            ? "No outreach sent yet"
            : `Base: ${sent} sent`}
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {STAGES.map((stage) => {
          const raw = totals[stage.key];
          const count = typeof raw === "number" ? raw : 0;
          const ratio = empty || sent === 0 ? 0 : count / sent;
          const pct = Math.round(ratio * 100);
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="w-20 text-xs font-medium text-slate-600">
                {stage.label}
              </span>
              <div
                className={cn(
                  "relative h-7 flex-1 overflow-hidden rounded-md bg-slate-50 ring-1 ring-inset",
                  stage.ring
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-md transition-[width] duration-500 ease-out",
                    stage.fill,
                    empty && "opacity-30"
                  )}
                  style={{ width: `${Math.max(ratio * 100, empty ? 0 : 1)}%` }}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs tabular-nums text-slate-700">
                  {count}
                  {!empty && (
                    <span className="ml-1 text-slate-400">({pct}%)</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leakage row, separated visually from the funnel */}
      <div className="mt-3 border-t border-slate-200/60 pt-3">
        <div className="flex items-center gap-3">
          <span className="w-20 text-xs font-medium text-red-700">
            Bounced
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-red-50 ring-1 ring-inset ring-red-200">
            <div
              className="h-full rounded-md bg-red-500"
              style={{
                width: `${
                  sent === 0
                    ? 0
                    : Math.min(100, (totals.bounced / Math.max(sent, 1)) * 100)
                }%`,
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs tabular-nums text-red-700">
              {totals.bounced}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
