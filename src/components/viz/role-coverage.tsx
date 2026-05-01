import { cn } from "@/lib/cn";

const TARGET_ROLES = [
  "CMO",
  "Head of Marketing",
  "Brand Director",
  "Growth Lead",
  "Head of Partnerships",
] as const;

export function RoleCoverage({
  dms,
}: {
  dms: Array<{ role: string }>;
}) {
  const counts = TARGET_ROLES.map(
    (r) => dms.filter((d) => d.role === r).length
  );
  const max = Math.max(1, ...counts);
  const covered = counts.filter((n) => n > 0).length;

  return (
    <div className="surface px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Role coverage
        </p>
        <p className="text-xs text-slate-500">
          {covered} / {TARGET_ROLES.length} roles found
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {TARGET_ROLES.map((role, i) => {
          const n = counts[i] ?? 0;
          const pct = (n / max) * 100;
          const filled = n > 0;
          return (
            <li key={role} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-36 text-xs font-medium",
                  filled ? "text-slate-700" : "text-slate-400"
                )}
              >
                {role}
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-slate-50 ring-1 ring-inset ring-slate-200/70">
                <div
                  className={cn(
                    "h-full rounded-md transition-[width] duration-500 ease-out",
                    filled
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      : "bg-slate-200"
                  )}
                  style={{
                    width: filled ? `${Math.max(pct, 8)}%` : "100%",
                    opacity: filled ? 1 : 0.3,
                  }}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs tabular-nums text-slate-700">
                  {n === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    n
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
