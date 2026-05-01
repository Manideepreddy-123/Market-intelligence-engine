import { eq, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { cn } from "@/lib/cn";

const STEPS = [
  "Research",
  "Report",
  "Decision Makers",
  "Contacts",
  "Outreach",
  "Tracking",
] as const;

export async function PipelineProgress({ companyId }: { companyId: string }) {
  const [
    [sourcesAgg],
    [reportsAgg],
    [dmsAgg],
    [contactsAgg],
    [outreachAgg],
    [eventsAgg],
  ] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.researchSources)
      .where(eq(schema.researchSources.companyId, companyId)),
    db
      .select({ n: count() })
      .from(schema.reports)
      .where(eq(schema.reports.companyId, companyId)),
    db
      .select({ n: count() })
      .from(schema.decisionMakers)
      .where(eq(schema.decisionMakers.companyId, companyId)),
    db
      .select({ n: count() })
      .from(schema.contacts)
      .innerJoin(
        schema.decisionMakers,
        eq(schema.contacts.decisionMakerId, schema.decisionMakers.id)
      )
      .where(eq(schema.decisionMakers.companyId, companyId)),
    db
      .select({ n: count() })
      .from(schema.outreach)
      .innerJoin(
        schema.contacts,
        eq(schema.outreach.contactId, schema.contacts.id)
      )
      .innerJoin(
        schema.decisionMakers,
        eq(schema.contacts.decisionMakerId, schema.decisionMakers.id)
      )
      .where(eq(schema.decisionMakers.companyId, companyId)),
    db
      .select({ n: count() })
      .from(schema.events)
      .innerJoin(schema.outreach, eq(schema.events.outreachId, schema.outreach.id))
      .innerJoin(
        schema.contacts,
        eq(schema.outreach.contactId, schema.contacts.id)
      )
      .innerJoin(
        schema.decisionMakers,
        eq(schema.contacts.decisionMakerId, schema.decisionMakers.id)
      )
      .where(eq(schema.decisionMakers.companyId, companyId)),
  ]);

  const flags = [
    (sourcesAgg?.n ?? 0) > 0,
    (reportsAgg?.n ?? 0) > 0,
    (dmsAgg?.n ?? 0) > 0,
    (contactsAgg?.n ?? 0) > 0,
    (outreachAgg?.n ?? 0) > 0,
    (eventsAgg?.n ?? 0) > 0,
  ];
  const completed = flags.filter(Boolean).length;
  const percent = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="rounded-xl bg-white/70 px-5 py-4 ring-1 ring-slate-200/70 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Pipeline progress
        </p>
        <p className="text-xs font-medium tabular-nums text-slate-600">
          {completed} / {STEPS.length} ·{" "}
          <span className="text-slate-900">{percent}%</span>
        </p>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-3 grid grid-cols-3 gap-1.5 text-[11px] sm:grid-cols-6">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors",
              flags[i]
                ? "text-slate-700"
                : "text-slate-400"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                flags[i] ? "bg-emerald-500" : "bg-slate-300"
              )}
            />
            <span className="truncate font-medium">{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
