# Market Intelligence Engine — Implementation Plan (Production, Token-Efficient)

## RULES
- Proceed ONLY after verification of previous step
- Use small, focused prompts to reduce token usage
- Persist intermediate outputs in DB

---

## Step 1: DB Schema

### Task
Create Drizzle schema for:
companies, research_sources, reports, decision_makers, contacts, outreach, events

### Verify
- Tables exist
- Migrations run cleanly

### Next Prompt
"Create research API to collect and store sources for a companyId"

---

## Step 2: Research API

### Task
- Integrate search provider
- Fetch 10–20 relevant URLs
- Store normalized sources

### Verify
- Sources saved with url/title/snippet/date
- No duplicates

### Next Prompt
"Generate structured company report using only stored sources"

---

## Step 3: Intelligence (Report)

### Task
- Call LLM with strict prompt
- Output JSON sections

### Verify
- Sections present
- Citations included or 'not found'

### Next Prompt
"Implement decision-maker role identification and extraction"

---

## Step 4: Decision Makers

### Task
- Identify roles
- Find people + profile URLs + sources

### Verify
- Real names/titles
- Source URLs present
- Confidence score set

### Next Prompt
"Add contact enrichment using provider API"

---

## Step 5: Contact Enrichment

### Task
- Query provider with domain + names
- Store verified emails + confidence

### Verify
- Emails either verified or marked unavailable
- No guessed data without label

### Next Prompt
"Generate personalized outreach messages"

---

## Step 6: Outreach Generation

### Task
- LinkedIn + Email drafts using report context

### Verify
- Mentions recent activity
- Not generic

### Next Prompt
"Implement send + tracking (open/click)"

---

## Step 7: Send + Tracking

### Task
- Send via Resend/SendGrid
- Add open pixel + click redirect
- Webhook for replies

### Verify
- Open/click events logged
- Status updates

### Next Prompt
"Build dashboard to view report, contacts, and tracking"

---

## Step 8: Dashboard

### Task
- Pages:
  /company/[id]/report
  /decision-makers
  /outreach
  /tracking

### Verify
- End-to-end flow visible

---

## Token Optimization Tips
- Limit sources to top 10–15
- Summarize sources before LLM
- Reuse stored outputs (don’t re-call LLM)
- Batch enrichment calls
- Cache results per company
