# What's left — step by step

Last updated: 2026-04-28

This file is the running punch-list to take the Market Intelligence Engine from "works on my machine" to "ready for the jury demo." Items are grouped by dependency: section A blocks demo, section F is verification. Mark items off as you go.

Legend: ❌ blocker · ⚠️ recommended · 💡 optional polish · ✅ done

---

## A. Blockers — without these, the demo has gaps

### A1. ❌ Set `FROM_EMAIL` in `.env`
**Why blocks:** Brevo refuses every send whose `From` address isn't on its verified-senders list. Outreach drafts generate fine; clicking **Send** on the Outreach tab will error until this is set.

**You do:**
1. Log in at https://app.brevo.com
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**
3. Enter the address you want to send from (a Gmail you control is fine for the demo).
4. Click the verification link Brevo emails.
5. Once status shows **Verified**, paste the address into `.env`:
   ```
   FROM_EMAIL=your.verified.address@gmail.com
   ```
6. Stop the dev server (`Ctrl+C`) and restart `npm run dev` (env is read at module scope; HMR doesn't pick it up).

**Verify:** open Outreach tab on a company that has at least one draft → click **Send** → toast says "sent" → row status flips to `sent`.

**Effort:** 5 minutes.

---

### A2. ❌ Re-run research on every company you'll demo
**Why blocks:** today's recall fix added 4 new Tavily queries (extra competitor angles, an experiential angle, two watchout angles) and reserved source slots. **Existing companies still have the old, narrower source pool.** Their next report regeneration will use whatever sources are already in the DB — which won't include the new query coverage.

**You do:**
1. Open each demo company.
2. Overview tab → **Re-run research**.
3. Wait for the toast (~30–60s).

**Verify:** open the Report tab → click **Generate new version** → the new report's Competitor mapping has 3+ entries with both "Current activity" and "Strengths & gaps" populated; Strategic watchouts and Experiential events are non-empty.

**Effort:** 1–2 minutes per company.

---

### A3. ❌ Regenerate reports for every company you'll demo
**Why blocks:** any report created before this morning has the old shape (`competitor.reasoning`, `event.summary`). The dashboard now reads `current_activity` / `strengths_and_gaps` / `format` / `scale` / `outcomes`. Old reports render with blank fields.

**You do:**
- After A2, click **Generate new version** on each company's Report tab.

**Verify:** check the report — every section card should show a citation-pip count > 0 and the source-mix bar should show segments.

**Effort:** ~10–20s per company (one Groq call).

---

## B. Configuration polish — recommended before deploy

### B1. ⚠️ Replace `TRACKING_SECRET`
**Why recommended:** the placeholder `replace-with-random-32-bytes` is functional but trivially guessable. With a real secret, open-pixel and click-redirect URLs cannot be spoofed.

**You do:**
- Windows PowerShell:
  ```powershell
  -join ((1..64) | % { '{0:x}' -f (Get-Random -Max 16) })
  ```
- Paste the 64-hex output into `.env` as `TRACKING_SECRET=...`.
- Restart `npm run dev`.

**Or:** ask me to generate one and write it in. I can do that in 10 seconds.

**Effort:** 1 minute.

---

### B2. ⚠️ Set a public `APP_URL` for live tracking
**Why recommended:** open-pixel and click URLs are baked into the email at send time. If `APP_URL` is `http://localhost:3000` and the jury opens the email on their machine, those URLs won't resolve and you won't see open / click events.

**Three ways, pick one:**

- **(a) Vercel free deploy** (recommended): push the repo to GitHub, connect on vercel.com, paste `.env` vars, you get a `https://your-app.vercel.app` URL. Set `APP_URL=https://your-app.vercel.app` and restart.
- **(b) ngrok tunnel** for the demo only: `ngrok http 3000` — URL changes every restart but works for a one-shot demo.
- **(c) Skip:** demo locally, send the test email to your own inbox on the same machine. Tracking still records.

**Effort:** Vercel ≈ 5 min, ngrok ≈ 2 min.

---

### B3. ⚠️ Configure Brevo webhook to point at `<APP_URL>/api/webhooks/email`
**Why recommended:** without this, you get **open** and **click** events (we record those ourselves via the pixel + redirect), but you DON'T get **delivered**, **bounced**, **complaint**, or **replied** events that Brevo posts back asynchronously.

**You do:**
1. In Brevo dashboard: **Transactional → Settings → Webhook**.
2. URL: `https://<your APP_URL>/api/webhooks/email`.
3. Events: tick **Delivered, Soft bounce, Hard bounce, Complaint, Spam, Replied, Click**.
4. Save.

**Verify:** send a test email to yourself, wait 30s, open Tracking tab → Delivered count > 0.

**Effort:** 3 minutes (only meaningful after B2).

---

## C. Brief items still partially covered

### C1. ⚠️ Phone numbers — product decision needed
**State:** the brief asks for phone numbers under "Contact Intelligence" (item 8 row 2). Hunter's free tier returns email-only; phone-finder APIs (Apollo, Lusha, RocketReach) are paid and conflict with the free-stack constraint.

**Three options:**
- **(a) Honest skip** — render "phone unavailable on free stack" badge on contacts. Most credible answer for the jury.
- **(b) Best-effort regex scrape** — extract phone-like patterns from already-scraped page content. Yield is low and includes front-desk numbers; sets a "phone may be inaccurate" expectation. ~1 hour to implement.
- **(c) Pay** — Apollo $49/mo gets ~120 verified mobile lookups. Out of free-stack scope.

**My recommendation:** (a) for the jury demo. The brief evaluates honesty and accuracy too — fabricating phones loses more than missing them.

**Effort:** (a) 15 min badge work, (b) 1 hour, (c) 5 min config + cost.

---

### C2. 💡 LinkedIn message send is draft-only by design
**State:** [src/services/outreach/generate.ts](src/services/outreach/generate.ts) generates *both* email and LinkedIn drafts; only email goes through Brevo. LinkedIn has no public outbound API on its free tier — the draft is meant to be copy-pasted into LinkedIn manually.

**No code change needed** — just framing for the jury: *"LinkedIn drafts are personalised and ready to send manually; email is automated end-to-end with tracking."* This is the standard pattern in commercial sales-engagement tools.

**Effort:** 0 — just talking points.

---

## D. Risk mitigation for demo day

### D1. ⚠️ Groq rate limit (free tier: 12k tokens/minute)
**State:** today's fix sized requests at ~9k tokens, leaving ~3k headroom. Generating reports for **two different companies within the same minute** can still trip the limit.

**Mitigation during demo:**
- Don't click **Generate new version** twice within 60 seconds.
- If you do hit it: the new error handling now bails fast with a clean toast saying *"Groq: rate limit exceeded — wait ~60s and retry"*. Wait 60s and re-click. No retry storm.

**Pre-demo:** on the morning of the demo, regenerate all three demo-company reports back-to-back (one minute apart). Then leave them alone — the rendered report is cached in `reports.content` and doesn't re-call Groq on tab loads.

---

### D2. ⚠️ Groq geo-block contingency
**State:** earlier in this session you saw a 403 "Access denied" from Groq's Cloudflare layer. Groq does not officially serve India; whether your IP gets blocked depends on the ISP routing on the day.

**Mitigation:**
- Have **Cloudflare WARP** or **Proton VPN free** installed and ready to switch on if Groq starts 403'ing during the demo. Either gets you a non-IN exit.
- The new error classifier in [src/services/llm/groq.ts](src/services/llm/groq.ts) detects 403 and shows *"Groq access denied — likely a geo-block or Cloudflare rule on this network"* — so if it happens you'll know immediately.

**Effort:** 2 minutes to install WARP.

---

### D3. ⚠️ Firecrawl 403s on Instagram / LinkedIn / X URLs
**State:** Firecrawl's TOS forbids scraping these domains; it returns a 403 with content blocked. We already handle this — pipeline falls through to Jina, and worst case the source has only a snippet not a full body. **No action needed.** Just don't be surprised if you see `[scrape] firecrawl failed` lines in the dev server log.

---

## E. Optional polish — only if you have spare time

### E1. 💡 Source-date timeline strip on the Report header
**What:** horizontal strip showing all cited sources as colored dots positioned by `published_at`, color-coded by `source_type`. Hover for title.

**Why:** visually answers "is this report fresh or stale?" in one glance, reinforces the `[stale]` text flags.

**Cost:** ~80 lines pure SVG, ~1 hour.

---

### E2. 💡 Pipeline Sankey on a `/how-it-works` page
**What:** Sankey diagram showing 9 search queries → ~28 sources → 6 report sections, band thickness = citation count.

**Why:** spectacular 30-second moment for the jury — explains the entire architecture in one viz.

**Cost:** Recharts dep + ~150 lines, ~3 hours.

---

### E3. 💡 Demo deck via the toolkit's `frontend-slides` skill
**What:** single-file HTML pitch deck (5 slides: problem / pipeline / anti-fabrication / cross-industry adaptability / live handoff). Animation-rich, viewport-fit, no deps.

**Why:** opens the demo with a 90-second narrative before dropping into the live dashboard. Tighter than walking through the dashboard cold.

**Cost:** ~2 hours, zero runtime impact (the deck is a static `.html` file outside the app).

---

## F. Pre-demo verification checklist

Run through this the night before. Don't skip. (~30 minutes.)

### F1. Three-companies-cold dry run
The brief explicitly tests against 3 companies across different industries with no reconfiguration. Pick three you have NOT tested yet:
- one consumer brand (e.g. Starbucks India, Nykaa)
- one B2B SaaS (e.g. Freshworks, Zoho)
- one fintech / regulated (e.g. Razorpay, Groww)

For each, run the full pipeline:
1. Add company (with domain).
2. Run research → wait for completion → check Research tab shows ~25–28 sources.
3. Generate report → check all 6 sections populate, citation pips show counts > 0, source-mix bar shows ≥3 colors.
4. Find decision-makers → check confidence histogram has bars in the 0.7+ range.
5. Enrich contacts → check at least one DM has an email.
6. Generate outreach → check email body follows the 5-part skeleton (opener references a specific report citation, ends with one ask).

### F2. Engagement funnel populates after one send
After A1 (`FROM_EMAIL` set):
1. Send one outreach to your own inbox.
2. Open it (loads the pixel).
3. Click any link in the body (loads the redirect).
4. Open Tracking tab → funnel shows Sent: 1, Opened: 1, Clicked: 1.

### F3. Citation links work
On any report, click a citation pill → opens the source URL in a new tab.

### F4. Mobile / narrow viewport
Resize browser to ~400px wide. Check that all four pages still render — funnel, histogram, status bar should respect responsive grid.

### F5. Old-shape report sanity check
Find any company with a report from before today. Open Report tab. Confirm citation pips show `0` for sections relying on the new shape (competitor mapping etc.). This proves you NEED to regenerate (A3) — don't skip A3 thinking "it'll work anyway."

---

## Quick reference — what I need from you next

In strict priority order:

1. **`FROM_EMAIL`** (A1) — only thing that genuinely blocks anything.
2. **Re-run research + regenerate reports** (A2 + A3) — for the three companies you'll demo.
3. **Phone-number decision** (C1) — pick (a), (b), or (c).
4. **(Optional)** Vercel deploy URL (B2) if you want live tracking with the jury.
5. **(Optional)** Demo deck (E3) if you want a stronger opening.

Everything else either has a sensible default, is already shipping, or is post-demo polish.
