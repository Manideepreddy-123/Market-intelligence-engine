import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { CompanyTabs } from "@/components/company-tabs";
import { PipelineProgress } from "@/components/pipeline-progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await db.query.companies.findFirst({
    where: eq(schema.companies.id, id),
  });
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft className="h-3 w-3" />
          All companies
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight gradient-text">
              {company.name}
            </h1>
            {company.category && (
              <Badge tone="brand" dot>
                {company.category}
              </Badge>
            )}
            {company.domain && (
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-violet-700"
              >
                <Globe className="h-3.5 w-3.5" />
                {company.domain}
              </a>
            )}
          </div>
        </div>
      </div>
      <PipelineProgress companyId={id} />
      <CompanyTabs companyId={id} />
      <div>{children}</div>
    </div>
  );
}
