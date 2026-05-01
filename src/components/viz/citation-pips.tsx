import { cn } from "@/lib/cn";

export function CitationPips({
  count,
  status,
  max = 6,
}: {
  count: number;
  status: "found" | "not_found";
  max?: number;
}) {
  const filled = Math.min(count, max);
  const tone =
    status === "found" && count > 0
      ? "bg-emerald-500"
      : "bg-slate-300";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-slate-500"
      title={`${count} citation${count === 1 ? "" : "s"}`}
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-1 rounded-sm transition-colors",
              i < filled ? tone : "bg-slate-200"
            )}
          />
        ))}
      </span>
      <span className="tabular-nums font-medium text-slate-600">
        {count}
        {count > max ? `+` : ""}
      </span>
    </span>
  );
}
