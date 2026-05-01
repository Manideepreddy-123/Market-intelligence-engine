import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  runDecisionMakersAction,
  enrichContactsAction,
  generateOutreachAction,
} from "@/actions/pipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfidenceHistogram } from "@/components/viz/confidence-histogram";
import { RoleCoverage } from "@/components/viz/role-coverage";
import { Users, ExternalLink, Linkedin } from "lucide-react";

export const dynamic = "force-dynamic";

function safeHost(u: string): string {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

function statusTone(s: string): "success" | "warning" | "muted" {
  if (s === "verified") return "success";
  if (s === "unverified" || s === "guessed") return "warning";
  return "muted";
}

export default async function DMPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, id),
  });
  if (!company) notFound();

  const dms = await db.query.decisionMakers.findMany({
    where: eq(schema.decisionMakers.companyId, id),
    orderBy: [desc(schema.decisionMakers.confidence)],
    with: { contacts: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ActionButton
            action={runDecisionMakersAction.bind(null, id)}
            variant={dms.length > 0 ? "outline" : "default"}
          >
            {dms.length > 0 ? "Re-run extraction" : "Find decision makers"}
          </ActionButton>
          <ActionButton
            action={enrichContactsAction.bind(null, id)}
            variant="outline"
            disabled={dms.length === 0 || !company.domain}
            title={
              !company.domain
                ? "Company has no domain set"
                : dms.length === 0
                  ? "Find decision makers first"
                  : undefined
            }
          >
            Enrich contacts
          </ActionButton>
        </div>
        {!company.domain && (
          <Badge tone="warning">Domain not set — enrichment disabled</Badge>
        )}
      </div>

      {dms.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ConfidenceHistogram dms={dms} />
          <RoleCoverage dms={dms} />
        </div>
      )}

      {dms.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No decision makers yet"
          description="Run extraction to discover marketing leadership for this company."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{dms.length} found</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="divide-y divide-slate-100">
              {dms.map((d) => {
                const contact = d.contacts[0];
                const sources = (d.sourceUrls as string[]) ?? [];
                return (
                  <div key={d.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {d.name}
                          </p>
                          <Badge tone="info">{d.role}</Badge>
                          {typeof d.confidence === "number" && (
                            <Badge tone="muted">
                              conf {d.confidence.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        {d.title && (
                          <p className="mt-0.5 text-sm text-slate-500">
                            {d.title}
                          </p>
                        )}
                        {d.profileUrl && (
                          <a
                            href={d.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                          >
                            <Linkedin className="h-3 w-3" />
                            {d.profileUrl.includes("linkedin.com")
                              ? "LinkedIn profile"
                              : "Profile"}
                          </a>
                        )}
                        {sources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sources.slice(0, 4).map((u) => (
                              <a
                                key={u}
                                href={u}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                              >
                                {safeHost(u)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {contact ? (
                          <>
                            <Badge tone={statusTone(contact.emailStatus)}>
                              {contact.emailStatus}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {contact.email ?? "—"}
                            </span>
                            <Badge tone="muted">phone unavailable on free stack</Badge>
                            {contact.email && (
                              <ActionButton
                                action={generateOutreachAction.bind(
                                  null,
                                  contact.id,
                                  id
                                )}
                                size="sm"
                                variant="outline"
                              >
                                Generate outreach
                              </ActionButton>
                            )}
                          </>
                        ) : (
                          <Badge tone="muted">not enriched</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
