import Link from "next/link";
import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/55">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 ring-focus-brand rounded-md"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-violet-700 text-white shadow-sm shadow-violet-900/20">
            <Activity className="h-4 w-4" />
            <span
              aria-hidden
              className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/15"
            />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-tight tracking-tight text-slate-900">
              Market Intelligence Engine
            </span>
            <span className="text-[10px] font-medium uppercase leading-tight tracking-[0.14em] text-slate-400">
              Research · Outreach · Tracking
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-slate-500 md:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-slate-100/80 hover:text-slate-900 ring-focus-brand"
          >
            Companies
          </Link>
        </nav>
      </div>
    </header>
  );
}
