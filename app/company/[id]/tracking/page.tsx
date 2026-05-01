import { notFound } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EngagementFunnel } from "@/components/viz/funnel";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

function statusTone(
  s: string
): "success" | "warning" | "muted" | "danger" | "info" {
  if (["sent", "delivered", "opened", "clicked", "replied"].includes(s)) return "success";
  if (s === "draft" || s === "queued") return "warning";
  if (s === "bounced" || s === "failed") return "danger";
  return "muted";
}

export default async function TrackingPage({
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
    with: { contacts: true },
  });
  const contactIds = dms.flatMap((d) => d.contacts.map((c) => c.id));
  const sent =
    contactIds.length === 0
      ? []
      : await db.query.outreach.findMany({
          where: inArray(schema.outreach.contactId, contactIds),
          orderBy: [desc(schema.outreach.sentAt)],
          with: { contact: { with: { decisionMaker: true } }, events: true },
        });

  const totals = {
    sent: sent.filter((o) => o.sentAt).length,
    delivered: sent.filter((o) => o.events.some((e) => e.eventType === "delivery")).length,
    opened: sent.filter((o) => o.events.some((e) => e.eventType === "open")).length,
    clicked: sent.filter((o) => o.events.some((e) => e.eventType === "click")).length,
    replied: sent.filter((o) => o.events.some((e) => e.eventType === "reply")).length,
    bounced: sent.filter((o) => o.events.some((e) => e.eventType === "bounce")).length,
  };

  return (
    <div className="space-y-4">
      <EngagementFunnel totals={totals} />

      {sent.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title="No sent outreach yet"
          description="Send a draft from the Outreach tab to start collecting tracking events."
        />
      ) : (
        <Card>
          <CardContent className="px-0 pb-0">
            <div className="divide-y divide-slate-100">
              {sent.map((o) => (
                <div key={o.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {o.contact.decisionMaker.name}
                        </p>
                        <Badge tone="muted">{o.channel}</Badge>
                        <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                      </div>
                      {o.sentAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          sent {o.sentAt.toISOString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {o.events.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          No events yet
                        </span>
                      ) : (
                        o.events.map((e) => (
                          <Badge key={e.id} tone="muted">
                            {e.eventType} ·{" "}
                            {e.occurredAt.toISOString().slice(11, 19)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
