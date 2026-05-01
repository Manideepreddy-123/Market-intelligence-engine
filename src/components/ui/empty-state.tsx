import * as React from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center backdrop-blur-sm",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-12 h-32 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.10),transparent_70%)]"
      />
      {icon && (
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-50 to-sky-50 text-violet-600 ring-1 ring-violet-200/60">
          {icon}
        </div>
      )}
      <div className="relative space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  );
}
