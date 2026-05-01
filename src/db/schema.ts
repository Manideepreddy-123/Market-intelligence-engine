import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const sourceTypeEnum = pgEnum("source_type", [
  "website",
  "news",
  "campaign",
  "competitor",
  "event",
  "other",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "verified",
  "unverified",
  "guessed",
  "unavailable",
]);

export const outreachChannelEnum = pgEnum("outreach_channel", [
  "linkedin",
  "email",
]);

export const outreachStatusEnum = pgEnum("outreach_status", [
  "draft",
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "replied",
  "bounced",
  "failed",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "delivery",
  "open",
  "click",
  "reply",
  "bounce",
  "complaint",
]);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category"),
    domain: text("domain"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    nameIdx: index("companies_name_idx").on(t.name),
    domainUnique: uniqueIndex("companies_domain_unique")
      .on(t.domain)
      .where(sql`${t.domain} IS NOT NULL`),
  })
);

export const researchSources = pgTable(
  "research_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    snippet: text("snippet"),
    content: text("content"),
    contentProvider: text("content_provider"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sourceType: sourceTypeEnum("source_type").notNull().default("other"),
    credibility: real("credibility"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    urlPerCompany: uniqueIndex("research_sources_company_url_unique").on(
      t.companyId,
      t.url
    ),
    companyIdx: index("research_sources_company_idx").on(t.companyId),
  })
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    content: jsonb("content").notNull(),
    citations: jsonb("citations").notNull().default(sql`'[]'::jsonb`),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    companyVersionUnique: uniqueIndex("reports_company_version_unique").on(
      t.companyId,
      t.version
    ),
  })
);

export const decisionMakers = pgTable(
  "decision_makers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    role: text("role").notNull(),
    profileUrl: text("profile_url"),
    sourceUrls: jsonb("source_urls").notNull().default(sql`'[]'::jsonb`),
    confidence: real("confidence"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    companyIdx: index("decision_makers_company_idx").on(t.companyId),
    companyNameRoleUnique: uniqueIndex(
      "decision_makers_company_name_role_unique"
    ).on(t.companyId, t.name, t.role),
  })
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    decisionMakerId: uuid("decision_maker_id")
      .notNull()
      .references(() => decisionMakers.id, { onDelete: "cascade" }),
    email: text("email"),
    emailStatus: emailStatusEnum("email_status").notNull().default("unavailable"),
    confidence: real("confidence"),
    provider: text("provider"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    dmIdx: index("contacts_decision_maker_idx").on(t.decisionMakerId),
    emailUnique: uniqueIndex("contacts_email_unique")
      .on(t.email)
      .where(sql`${t.email} IS NOT NULL`),
  })
);

export const outreach = pgTable(
  "outreach",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    channel: outreachChannelEnum("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    status: outreachStatusEnum("status").notNull().default("draft"),
    messageId: text("message_id"),
    providerMessageId: text("provider_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => ({
    contactIdx: index("outreach_contact_idx").on(t.contactId),
    messageIdUnique: uniqueIndex("outreach_message_id_unique")
      .on(t.messageId)
      .where(sql`${t.messageId} IS NOT NULL`),
  })
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    outreachId: uuid("outreach_id")
      .notNull()
      .references(() => outreach.id, { onDelete: "cascade" }),
    eventType: eventTypeEnum("event_type").notNull(),
    payload: jsonb("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    outreachIdx: index("events_outreach_idx").on(t.outreachId),
    typeIdx: index("events_type_idx").on(t.eventType),
  })
);

export const companiesRelations = relations(companies, ({ many }) => ({
  sources: many(researchSources),
  reports: many(reports),
  decisionMakers: many(decisionMakers),
}));

export const researchSourcesRelations = relations(researchSources, ({ one }) => ({
  company: one(companies, {
    fields: [researchSources.companyId],
    references: [companies.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  company: one(companies, {
    fields: [reports.companyId],
    references: [companies.id],
  }),
}));

export const decisionMakersRelations = relations(
  decisionMakers,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [decisionMakers.companyId],
      references: [companies.id],
    }),
    contacts: many(contacts),
  })
);

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  decisionMaker: one(decisionMakers, {
    fields: [contacts.decisionMakerId],
    references: [decisionMakers.id],
  }),
  outreach: many(outreach),
}));

export const outreachRelations = relations(outreach, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [outreach.contactId],
    references: [contacts.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  outreach: one(outreach, {
    fields: [events.outreachId],
    references: [outreach.id],
  }),
}));
