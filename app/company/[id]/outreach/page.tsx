import { notFound } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendOutreachAction } from "@/actions/pipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { OutreachStatusBar } from "@/components/viz/status-bar";
import { Send, Linkedin, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

function statusTone(
  s: string
): "success" | "warning" | "muted" | "danger" | "info" {
  if (["sent", "delivered", "opened", "clicked", "replied"].includes(s)) return "success";
  if (s === "draft" || s === "queued") return "warning";
  if (s === "bounced" || s === "failed") return "danger";
  return "muted";
}

export default async function OutreachPage({
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
  const drafts =
    contactIds.length === 0
      ? []
      : await db.query.outreach.findMany({
          where: inArray(schema.outreach.contactId, contactIds),
          orderBy: [desc(schema.outreach.createdAt)],
          with: { contact: { with: { decisionMaker: true } } },
        });

  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={<Send className="h-5 w-5" />}
        title="No outreach drafts yet"
        description='Generate outreach for each contact from the "Decision Makers" tab.'
      />
    );
  }

  return (
    <div className="space-y-3">
      <OutreachStatusBar drafts={drafts} />
      {drafts.map((o) => (
        <Card key={o.id}>
          <CardContent className="px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {o.contact.decisionMaker.name}
                  </p>
                  {o.channel === "email" ? (
                    <Badge tone="info">
                      <Mail className="mr-1 h-3 w-3" />
                      Email
                    </Badge>
                  ) : (
                    <Badge tone="info">
                      <Linkedin className="mr-1 h-3 w-3" />
                      LinkedIn
                    </Badge>
                  )}
                  <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                </div>
                {o.subject && (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Subject: </span>
                    {o.subject}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {o.channel === "email" && o.status === "draft" && (
                  <ActionButton
                    action={sendOutreachAction.bind(null, o.id, id)}
                    size="sm"
                  >
                    Send
                  </ActionButton>
                )}
                {o.sentAt && (
                  <span className="text-xs text-slate-500">
                    sent {o.sentAt.toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                )}
              </div>
            </div>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              {o.body}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
