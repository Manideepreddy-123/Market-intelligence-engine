"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { runResearch } from "@/services/research";
import { generateReport } from "@/services/intelligence";
import { runDecisionMakers } from "@/services/decision-makers";
import { enrichContactsForCompany } from "@/services/contacts";
import { generateOutreachForContact } from "@/services/outreach/generate";
import { sendOutreach } from "@/services/outreach/send";

function refreshCompany(id: string) {
  revalidatePath(`/company/${id}`);
  revalidatePath(`/company/${id}/report`);
  revalidatePath(`/company/${id}/decision-makers`);
  revalidatePath(`/company/${id}/outreach`);
  revalidatePath(`/company/${id}/tracking`);
}

export async function createCompanyAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const domain = String(formData.get("domain") ?? "").trim() || null;
  if (!name) throw new Error("Name is required");

  const [row] = await db
    .insert(schema.companies)
    .values({ name, category, domain })
    .returning();
  revalidatePath("/");
  return row;
}

export async function runResearchAction(companyId: string) {
  const r = await runResearch(companyId);
  refreshCompany(companyId);
  return r;
}

export async function runReportAction(companyId: string) {
  const r = await generateReport(companyId);
  refreshCompany(companyId);
  return r;
}

export async function runDecisionMakersAction(companyId: string) {
  const r = await runDecisionMakers(companyId);
  refreshCompany(companyId);
  return r;
}

export async function enrichContactsAction(companyId: string) {
  const r = await enrichContactsForCompany(companyId);
  refreshCompany(companyId);
  return r;
}

export async function generateOutreachAction(contactId: string, companyId: string) {
  const r = await generateOutreachForContact(contactId);
  refreshCompany(companyId);
  return r;
}

export async function sendOutreachAction(outreachId: string, companyId: string) {
  const r = await sendOutreach(outreachId);
  refreshCompany(companyId);
  return r;
}
