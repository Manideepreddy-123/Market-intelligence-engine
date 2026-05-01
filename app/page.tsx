import Link from "next/link";
import { db, schema } from "@/db";
import { desc, count } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCompanyForm } from "@/components/create-company-form";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Building2,
  ArrowUpRight,
  Building,
  FileText,
  ScrollText,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [companies, [companiesAgg], [sourcesAgg], [reportsAgg], [sentAgg]] =
    await Promise.all([
      db.query.companies.findMany({
        orderBy: [desc(schema.companies.createdAt)],
        limit: 50,
      }),
      db.select({ n: count() }).from(schema.companies),
      db.select({ n: count() }).from(schema.researchSources),
      db.select({ n: count() }).from(schema.reports),
      db.select({ n: count() }).from(schema.outreach),
    ]);

  const stats = [
    {
      label: "Companies",
      value: companiesAgg?.n ?? 0,
      icon: Building,
      tint: "from-violet-500/15 to-violet-500/0 text-violet-600",
    },
    {
      label: "Research sources",
      value: sourcesAgg?.n ?? 0,
      icon: ScrollText,
      tint: "from-sky-500/15 to-sky-500/0 text-sky-600",
    },
    {
      label: "Reports",
      value: reportsAgg?.n ?? 0,
      icon: FileText,
      tint: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    },
    {
      label: "Outreach drafts",
      value: sentAgg?.n ?? 0,
      icon: Send,
      tint: "from-fuchsia-500/15 to-fuchsia-500/0 text-fuchsia-600",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl bg-white/60 px-6 py-10 ring-1 ring-slate-200/70 backdrop-blur-sm sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gradient-to-br from-violet-300/40 via-fuchsia-200/30 to-sky-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-12 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-200/30 to-violet-300/30 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 ring-1 ring-inset ring-violet-200">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-violet-500" />
            Live
          </span>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight gradient-text sm:text-4xl">
            Pre-engagement intelligence,
            <br className="hidden sm:block" /> ready in minutes.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Add a company. We research the brand, map competitors, surface
            decision-makers, draft personalised outreach, and track engagement —
            grounded only in cited public sources.
          </p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="surface relative overflow-hidden px-5 py-4"
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.tint} blur-xl`}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                      {s.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                      {s.value.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.tint} ring-1 ring-inset ring-white/40`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add a company</CardTitle>
            <CardDescription>
              Name + one-line category is enough. Domain unlocks contact
              enrichment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCompanyForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>All companies</CardTitle>
              <CardDescription>{companies.length} most recent</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {companies.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState
                  icon={<Building2 className="h-5 w-5" />}
                  title="No companies yet"
                  description="Add one on the left to get started."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100/80">
                {companies.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/company/${c.id}`}
                      className="group flex items-center justify-between gap-3 px-6 py-3.5 transition-colors duration-150 hover:bg-violet-50/40 ring-focus-brand"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/80 transition-colors group-hover:from-violet-100 group-hover:to-violet-50 group-hover:text-violet-700 group-hover:ring-violet-200">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {c.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {c.category ?? "—"}
                            {c.domain ? ` · ${c.domain}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-xs tabular-nums text-slate-400 sm:inline">
                          {c.createdAt.toISOString().slice(0, 10)}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
