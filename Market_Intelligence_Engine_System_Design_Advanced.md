# Market Intelligence Engine — System Design (Production)

## 1. High-Level Architecture

User Input
  ↓
Research Service (Search + Scrape)
  ↓
Evidence Store (Postgres)
  ↓
LLM Intelligence Service
  ↓
Decision-Maker Service
  ↓
Contact Enrichment Service
  ↓
Outreach Service
  ↓
Tracking Service
  ↓
Dashboard (Next.js)

---

## 2. Components

### 2.1 Research Service
- Providers: SerpAPI/Google CSE, Firecrawl
- Output: normalized sources (url, title, snippet, date, type)

### 2.2 Data Layer
- Postgres (Aurora/Supabase) + Drizzle
- Tables: companies, research_sources, reports, competitors, activities, decision_makers, contacts, outreach, events

### 2.3 Intelligence (LLM)
- Prompt with strict rules (no fabrication)
- Returns structured JSON
- Stores report + citations

### 2.4 Decision-Maker Service
- Role-first search
- Extract people + profile links + sources
- Confidence scoring

### 2.5 Contact Enrichment
- Hunter/Apollo
- Email verification + confidence
- Mark unavailable if not verified

### 2.6 Outreach Service
- Templates + LLM personalization
- LinkedIn (≤600 chars), Email (≤180 words)

### 2.7 Tracking Service
- Open: /api/track/open?mid=
- Click: /api/track/click?mid=&url=
- Webhooks: delivery/reply/bounce

---

## 3. Data Flow

Input → Search → Store Sources → LLM Report → Roles/People → Enrich Contacts → Generate Outreach → Send → Track

---

## 4. APIs

POST /api/companies
POST /api/research/run
POST /api/report/generate
POST /api/decision-makers/run
POST /api/contacts/enrich
POST /api/outreach/generate
POST /api/outreach/send
GET  /api/track/open
GET  /api/track/click
POST /api/webhooks/email

---

## 5. Async & Queues
- Use Inngest/BullMQ
- Jobs: research, report, decision-makers, enrichment, outreach

---

## 6. Caching & Cost Control
- Cache search results by company/domain
- Deduplicate URLs
- Chunk sources for LLM
- Reuse embeddings if added later

---

## 7. Security & Compliance
- Respect ToS (no LinkedIn scraping)
- Store minimal PII
- Encrypt secrets (env)

---

## 8. Observability
- Structured logs
- Metrics: job time, success rate
- Error retries with backoff
