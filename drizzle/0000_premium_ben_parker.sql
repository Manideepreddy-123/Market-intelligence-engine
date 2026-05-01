CREATE TYPE "public"."email_status" AS ENUM('verified', 'unverified', 'guessed', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('delivery', 'open', 'click', 'reply', 'bounce', 'complaint');--> statement-breakpoint
CREATE TYPE "public"."outreach_channel" AS ENUM('linkedin', 'email');--> statement-breakpoint
CREATE TYPE "public"."outreach_status" AS ENUM('draft', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('website', 'news', 'campaign', 'competitor', 'event', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"domain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_maker_id" uuid NOT NULL,
	"email" text,
	"email_status" "email_status" DEFAULT 'unavailable' NOT NULL,
	"confidence" real,
	"provider" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_makers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"role" text NOT NULL,
	"profile_url" text,
	"source_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outreach_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outreach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"channel" "outreach_channel" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"status" "outreach_status" DEFAULT 'draft' NOT NULL,
	"message_id" text,
	"provider_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" jsonb NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"snippet" text,
	"content" text,
	"content_provider" text,
	"published_at" timestamp with time zone,
	"source_type" "source_type" DEFAULT 'other' NOT NULL,
	"credibility" real,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_decision_maker_id_decision_makers_id_fk" FOREIGN KEY ("decision_maker_id") REFERENCES "public"."decision_makers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decision_makers" ADD CONSTRAINT "decision_makers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_outreach_id_outreach_id_fk" FOREIGN KEY ("outreach_id") REFERENCES "public"."outreach"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outreach" ADD CONSTRAINT "outreach_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "companies_domain_unique" ON "companies" USING btree ("domain") WHERE "companies"."domain" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_decision_maker_idx" ON "contacts" USING btree ("decision_maker_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_email_unique" ON "contacts" USING btree ("email") WHERE "contacts"."email" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decision_makers_company_idx" ON "decision_makers" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "decision_makers_company_name_role_unique" ON "decision_makers" USING btree ("company_id","name","role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_outreach_idx" ON "events" USING btree ("outreach_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outreach_contact_idx" ON "outreach" USING btree ("contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "outreach_message_id_unique" ON "outreach" USING btree ("message_id") WHERE "outreach"."message_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reports_company_version_unique" ON "reports" USING btree ("company_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "research_sources_company_url_unique" ON "research_sources" USING btree ("company_id","url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_sources_company_idx" ON "research_sources" USING btree ("company_id");