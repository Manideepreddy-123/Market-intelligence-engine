import { notFound } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { runReportAction } from "@/actions/pipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { CitationPips } from "@/components/viz/citation-pips";
import { SourceMixBar } from "@/components/viz/source-mix-bar";
import { SourceTimeline, type TimelinePoint } from "@/components/viz/source-timeline";
import { TopDomains } from "@/components/viz/top-domains";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

type Section = { status: "found" | "not_found"; summary: string; citations: string[] };
type Competitor = {
  name: string;
  current_activity: string;
  strengths_and_gaps: string;
  citations: string[];
};
type Activity = {
  title: string;
  date: string | null;
  summary: string;
  citations: string[];
};
type EventEntry = {
  title: string;
  date: string | null;
  format: string;
  scale: string;
  outcomes: string;
  citations: string[];
};
type ReportContent = {
  company_overview: Section;
  market_position: Section;
  competitor_mapping: {
    status: "found" | "not_found";
    competitors: Competitor[];
  };
  brand_activity: {
    status: "found" | "not_found";
    activities: Activity[];
  };
  experiential_events: {
    status: "found" | "not_found";
    events: EventEntry[];
  };
  strategic_watchouts: {
    status: "found" | "not_found";
    items: Array<{ issue: string; impact: string; citations: string[] }>;
  };
};

function safeHost(u: string): string {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

function StatusBadge({ status }: { status: "found" | "not_found" }) {
  return (
    <Badge tone={status === "found" ? "success" : "muted"}>
      {status === "found" ? "Found" : "Not found"}
    </Badge>
  );
}

function Citations({ urls }: { urls: string[] }) {
  if (!urls?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {urls.map((u) => (
        <a
          key={u}
          href={u}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-900"
        >
          {safeHost(u)}
        </a>
      ))}
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, id),
  });
  if (!company) notFound();
  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.companyId, id),
    orderBy: [desc(schema.reports.version)],
  });

  if (!report) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="No report yet"
        description="Run research first, then generate the intelligence report."
        action={
          <ActionButton action={runReportAction.bind(null, id)}>
            Generate report
          </ActionButton>
        }
      />
    );
  }

  const content = report.content as unknown as ReportContent;

  // Pull every research_source row whose URL the report cited.
  // Powers three vizzes: source-mix bar, timeline, top-domains.
  const citedUrls = (report.citations as unknown as string[]) ?? [];
  type SourceType = "website" | "news" | "campaign" | "event" | "competitor" | "other";
  const sourceMix: Partial<Record<SourceType, number>> = {};
  let timelinePoints: TimelinePoint[] = [];
  if (citedUrls.length > 0) {
    const rows = await db.query.researchSources.findMany({
      where: inArray(schema.researchSources.url, citedUrls),
      columns: {
        url: true,
        title: true,
        publishedAt: true,
        sourceType: true,
      },
    });
    for (const r of rows) {
      const t = r.sourceType as SourceType;
      sourceMix[t] = (sourceMix[t] ?? 0) + 1;
    }
    timelinePoints = rows.map((r) => ({
      url: r.url,
      title: r.title,
      publishedAt: r.publishedAt,
      sourceType: r.sourceType as SourceType,
    }));
  }

  // Per-section citation counts.
  const counts = {
    company_overview: content.company_overview.citations.length,
    market_position: content.market_position.citations.length,
    competitor_mapping: content.competitor_mapping.competitors.reduce(
      (s, c) => s + (c.citations?.length ?? 0),
      0
    ),
    brand_activity: content.brand_activity.activities.reduce(
      (s, a) => s + (a.citations?.length ?? 0),
      0
    ),
    experiential_events: content.experiential_events.events.reduce(
      (s, e) => s + (e.citations?.length ?? 0),
      0
    ),
    strategic_watchouts: content.strategic_watchouts.items.reduce(
      (s, w) => s + (w.citations?.length ?? 0),
      0
    ),
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Report
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              v{report.version} ·{" "}
              <span className="text-slate-500">{report.model}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {report.createdAt.toISOString()}
            </p>
          </div>
          <ActionButton action={runReportAction.bind(null, id)} variant="outline">
            Regenerate
          </ActionButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source pool</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <SourceMixBar counts={sourceMix} />
            <SourceTimeline points={timelinePoints} />
          </div>
          <TopDomains urls={citedUrls} />
        </CardContent>
      </Card>

      {(["company_overview", "market_position"] as const).map((key) => {
        const s = content[key];
        return (
          <Card key={key}>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle className="capitalize">
                {key.replace(/_/g, " ")}
              </CardTitle>
              <div className="flex items-center gap-3">
                <CitationPips count={counts[key]} status={s.status} />
                <StatusBadge status={s.status} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">
                {s.summary}
              </p>
              <Citations urls={s.citations} />
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Competitor mapping</CardTitle>
          <div className="flex items-center gap-3">
            <CitationPips
              count={counts.competitor_mapping}
              status={content.competitor_mapping.status}
            />
            <StatusBadge status={content.competitor_mapping.status} />
          </div>
        </CardHeader>
        <CardContent>
          {content.competitor_mapping.competitors.length === 0 ? (
            <p className="text-sm text-slate-500">No competitors found.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {content.competitor_mapping.competitors.map((c, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  <div className="mt-1.5 space-y-1.5">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Current activity: </span>
                      {c.current_activity}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Strengths &amp; gaps: </span>
                      {c.strengths_and_gaps}
                    </p>
                  </div>
                  <Citations urls={c.citations} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Brand activity</CardTitle>
          <div className="flex items-center gap-3">
            <CitationPips
              count={counts.brand_activity}
              status={content.brand_activity.status}
            />
            <StatusBadge status={content.brand_activity.status} />
          </div>
        </CardHeader>
        <CardContent>
          {content.brand_activity.activities.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing logged.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {content.brand_activity.activities.map((a, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    {a.date && (
                      <span className="text-xs text-slate-500">{a.date}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-700">{a.summary}</p>
                  <Citations urls={a.citations} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Experiential &amp; events</CardTitle>
          <div className="flex items-center gap-3">
            <CitationPips
              count={counts.experiential_events}
              status={content.experiential_events.status}
            />
            <StatusBadge status={content.experiential_events.status} />
          </div>
        </CardHeader>
        <CardContent>
          {content.experiential_events.events.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing logged.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {content.experiential_events.events.map((e, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                    {e.date && (
                      <span className="text-xs text-slate-500">{e.date}</span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-1.5">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Format: </span>
                      {e.format}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Scale: </span>
                      {e.scale}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Outcomes: </span>
                      {e.outcomes}
                    </p>
                  </div>
                  <Citations urls={e.citations} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Strategic watchouts</CardTitle>
          <div className="flex items-center gap-3">
            <CitationPips
              count={counts.strategic_watchouts}
              status={content.strategic_watchouts.status}
            />
            <StatusBadge status={content.strategic_watchouts.status} />
          </div>
        </CardHeader>
        <CardContent>
          {content.strategic_watchouts.items.length === 0 ? (
            <p className="text-sm text-slate-500">None flagged.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {content.strategic_watchouts.items.map((w, i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {w.issue}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{w.impact}</p>
                  <Citations urls={w.citations} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
