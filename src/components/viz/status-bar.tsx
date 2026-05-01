import { cn } from "@/lib/cn";

type Status =
  | "draft"
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "replied"
  | "bounced"
  | "failed";

const ORDER: Status[] = [
  "draft",
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "replied",
  "bounced",
  "failed",
];

const COLOR: Record<Status, string> = {
  draft: "bg-slate-300",
  queued: "bg-amber-400",
  sent: "bg-sky-500",
  delivered: "bg-sky-600",
  opened: "bg-violet-500",
  clicked: "bg-fuchsia-500",
  replied: "bg-emerald-500",
  bounced: "bg-red-500",
  failed: "bg-red-600",
};

const LABEL: Record<Status, string> = {
  draft: "Draft",
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  replied: "Replied",
  bounced: "Bounced",
  failed: "Failed",
};

export function OutreachStatusBar({
  drafts,
}: {
  drafts: Array<{ status: string }>;
}) {
  const counts = ORDER.reduce<Record<Status, number>>(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<Status, number>
  );
  for (const d of drafts) {
    if ((ORDER as readonly string[]).includes(d.status)) {
      counts[d.status as Status]++;
    }
  }
  const total = drafts.length;

  return (
    <div className="surface px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Outreach status
        </p>
        <p className="text-xs text-slate-500">
          {total} {total === 1 ? "draft" : "drafts"}
        </p>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
        {total === 0 ? null : (
          ORDER.map((s) => {
            const n = counts[s];
            if (n === 0) return null;
            return (
              <span
                key={s}
                className={cn("h-full", COLOR[s])}
                style={{ width: `${(n / total) * 100}%` }}
                title={`${LABEL[s]}: ${n}`}
              />
            );
          })
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        {ORDER.filter((s) => counts[s] > 0).map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-sm", COLOR[s])} />
            <span className="font-medium">{LABEL[s]}</span>
            <span className="tabular-nums text-slate-400">{counts[s]}</span>
          </li>
        ))}
        {total === 0 && (
          <li className="text-slate-400">No drafts yet.</li>
        )}
      </ul>
    </div>
  );
}
