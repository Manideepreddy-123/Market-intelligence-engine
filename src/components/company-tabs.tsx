"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { segment: null, href: "", label: "Overview" },
  { segment: "report", href: "/report", label: "Report" },
  { segment: "decision-makers", href: "/decision-makers", label: "Decision Makers" },
  { segment: "outreach", href: "/outreach", label: "Outreach" },
  { segment: "tracking", href: "/tracking", label: "Tracking" },
] as const;

export function CompanyTabs({ companyId }: { companyId: string }) {
  const segment = useSelectedLayoutSegment();
  return (
    <div className="border-b border-slate-200/70">
      <nav className="-mb-px flex flex-wrap gap-0.5">
        {TABS.map((tab) => {
          const active = tab.segment === segment;
          return (
            <Link
              key={tab.label}
              href={`/company/${companyId}${tab.href}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-t-md px-3.5 py-2.5 text-sm font-medium transition-colors duration-150",
                "ring-focus-brand",
                active
                  ? "text-slate-900"
                  : "text-slate-500 hover:bg-slate-100/60 hover:text-slate-800"
              )}
            >
              {tab.label}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-violet-500 to-sky-500 opacity-100"
                    : "opacity-0"
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
