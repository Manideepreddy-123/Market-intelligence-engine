import Link from "next/link";
import { eq, count } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  runResearchAction,
  runReportAction,
  runDecisionMakersAction,
  enrichContactsAction,
} from "@/actions/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/action-button";
import { cn } from "@/lib/cn";
import {
  Search,
  FileText,
  Users,
  Mail,
  Send,
  Activity,
  CheckCircle2,
  Circle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    [sourcesAgg],
    [reportsAgg],
    [dmsAgg],
    [contactsAgg],
    [outreachAgg],
    [sentAgg],
  ] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.researchSources)
      .where(eq(schema.researchSources.companyId, id)),
    db
      .select({ n: count() })
      .from(schema.reports)
      .where(eq(schema.reports.companyId, id)),
    db
      .select({ n: count() })
      .from(schema.decisionMakers)
      .where(eq(schema.decisionMakers.companyId, id)),
    db
      .select({ n: count() })
      .from(schema.contacts)
      .innerJoin(
        schema.decisionMakers,
        eq(schema.contacts.decisionMakerId, schema.decisionMakers.id)
      )
      .where(eq(schema.decisionMakers.companyId, id)),
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
      .where(eq(schema.decisionMakers.companyId, id)),
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
      .where(eq(schema.decisionMakers.companyId, id)),
  ]);

  const sources = sourcesAgg?.n ?? 0;
  const reports = reportsAgg?.n ?? 0;
  const dms = dmsAgg?.n ?? 0;
  const contacts = contactsAgg?.n ?? 0;
  const outreach = outreachAgg?.n ?? 0;
  void sentAgg;

  const steps = [
    {
      n: 1,
      icon: Search,
      title: "Research",
      description: "Tavily search across 5 query types, then full-page scrape via Firecrawl (with Jina fallback).",
      done: sources > 0,
      summary: `${sources} ${sources === 1 ? "source" : "sources"}`,
      action: runResearchAction.bind(null, id),
      label: sources > 0 ? "Re-run research" : "Run research",
      tab: null,
    },
    {
      n: 2,
      icon: FileText,
      title: "Intelligence report",
      description: "Groq Llama 3.3 70B reads stored sources and produces a cited JSON report.",
      done: reports > 0,
      summary: reports > 0 ? `${reports} ${reports === 1 ? "version" : "versions"}` : "Not generated",
      action: runReportAction.bind(null, id),
      label: reports > 0 ? "Generate new version" : "Generate report",
      tab: "report" as const,
      disabled: sources === 0,
      disabledReason: "Run research first",
    },
    {
      n: 3,
      icon: Users,
      title: "Decision makers",
      description: "Role-first search → LLM extraction with confidence scoring.",
      done: dms > 0,
      summary: dms > 0 ? `${dms} found` : "Not run",
      action: runDecisionMakersAction.bind(null, id),
      label: dms > 0 ? "Re-run extraction" : "Find decision makers",
      tab: "decision-makers" as const,
    },
    {
      n: 4,
      icon: Mail,
      title: "Contact enrichment",
      description: "Hunter.io email finder with confidence score; never guesses.",
      done: contacts > 0,
      summary: contacts > 0 ? `${contacts} ${contacts === 1 ? "contact" : "contacts"}` : "Not enriched",
      action: enrichContactsAction.bind(null, id),
      label: contacts > 0 ? "Re-enrich" : "Enrich contacts",
      tab: "decision-makers" as const,
      disabled: dms === 0,
      disabledReason: "Find decision makers first",
    },
    {
      n: 5,
      icon: Send,
      title: "Outreach",
      description: "Personalized email + LinkedIn drafts grounded in the latest report.",
      done: outreach > 0,
      summary: outreach > 0 ? `${outreach} ${outreach === 1 ? "draft" : "drafts"}` : "No drafts",
      tab: "outreach" as const,
      hideAction: true,
      disabled: contacts === 0 || reports === 0,
      disabledReason: "Generate per-contact from the Outreach tab",
    },
    {
      n: 6,
      icon: Activity,
      title: "Tracking",
      description: "Open / click / reply events from sent outreach.",
      done: false,
      summary: "Send drafts to populate",
      tab: "tracking" as const,
      hideAction: true,
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.n}
            className={cn(
              "surface-interactive",
              s.done && "ring-emerald-200/60"
            )}
          >
            <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset transition-colors",
                      s.done
                        ? "bg-gradient-to-br from-emerald-50 to-emerald-100/60 text-emerald-600 ring-emerald-200"
                        : "bg-gradient-to-br from-slate-50 to-slate-100/60 text-slate-400 ring-slate-200/80"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm",
                      s.done ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  >
                    {s.done ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Circle className="h-2.5 w-2.5" />
                    )}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Step {s.n}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {s.title}
                    </h3>
                    {s.done ? (
                      <Badge tone="success" dot>
                        {s.summary}
                      </Badge>
                    ) : (
                      <Badge tone="muted" dot>
                        {s.summary}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">
                    {s.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {s.tab !== undefined && s.tab !== null && (
                  <Link
                    href={`/company/${id}/${s.tab}`}
                    className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-violet-700 ring-focus-brand"
                  >
                    View →
                  </Link>
                )}
                {!s.hideAction && s.action && (
                  <ActionButton
                    action={s.action}
                    variant={s.done ? "outline" : "default"}
                    disabled={Boolean(s.disabled)}
                    title={s.disabled ? s.disabledReason : undefined}
                  >
                    {s.label}
                  </ActionButton>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
