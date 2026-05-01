# Requirements to Run the Market Intelligence Engine

Last updated: 2026-04-27

Legend: ✅ already configured · ❌ you need to provide · ⚠️ optional / polish

---

## A. Already Configured — do NOT need to re-provide

These are live in `.env` and verified working:

| Var | Service | Free-tier limit | Status |
|---|---|---|---|
| `DATABASE_URL` | Supabase Postgres (transaction pooler, port 6543) | 500 MB | ✅ |
| `GROQ_API_KEY` | Groq — Llama 3.3 70B (report, DM extraction, outreach gen) | 30 req/min, 14.4k req/day | ✅ |
| `TAVILY_API_KEY` | Tavily search (5 query types per company) | 1,000 req/month | ✅ |
| `FIRECRAWL_API_KEY` | Firecrawl scraping (primary) | 500 scrapes/month | ✅ |
| `JINA_API_KEY` | Jina Reader (scraping fallback) | generous free RPM | ✅ |
| `HUNTER_API_KEY` | Hunter.io email finder | 50 lookups/month | ✅ |
| `BREVO_API_KEY` | Brevo v3 REST email send (`xkeysib-…` form, verified `/v3/account` returns 200) | 300 emails/day | ✅ |
| `APP_URL` | Local dev URL | — | ✅ (`http://localhost:3000`) |

---

## B. Still Required — you must provide

### 1. `FROM_EMAIL` — a verified Brevo sender ❌

**Why:** Brevo rejects every send whose `From` address isn't on its verified list. This is the **only** thing blocking end-to-end outreach send.

**How to get it (5 min):**
1. Log in at https://app.brevo.com
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**
3. Enter the email you want to send from. Either works:
   - A personal Gmail/Outlook you control (fine for the jury demo)
   - An address on a domain you control (better deliverability, requires SPF/DKIM)
4. Brevo emails a verification link to that inbox — click it
5. Once status flips to **Verified**, paste the exact address into `.env`:
   ```
   FROM_EMAIL=your.verified.address@example.com
   ```

---

## C. Strongly Recommended

### 2. `TRACKING_SECRET` — 32 random bytes ⚠️

**Why:** HMAC-signs outreach IDs embedded in open-pixel + click-redirect URLs so they can't be spoofed. Current value `replace-with-random-32-bytes` is technically functional but trivially guessable — replace before any public demo.

**How to generate:**
- Windows PowerShell:
  ```powershell
  -join ((1..64) | % { '{0:x}' -f (Get-Random -Max 16) })
  ```
- Or open https://generate-random.org/api-key-generator → 64 hex chars
- Or just say "generate one for me" — I'll write a fresh one in.

---

## D. Optional — needed only for live jury demo against a public URL

### 3. Public `APP_URL` ⚠️

**Why:** Open/click tracking pixels load from `APP_URL`. If you demo by sending real emails to the jury's laptop, those emails will try to fetch `http://localhost:3000/api/track/open/...` which won't resolve outside your machine.

**Three options (pick one):**

- **(a) Vercel deploy** — free, zero-config for Next.js, ~3 min to set up. Push the repo, connect on vercel.com, paste the same `.env` vars, get a `https://your-app.vercel.app` URL → set as `APP_URL`. *Recommended.*
- **(b) ngrok tunnel** — `ngrok http 3000` gives a temporary `https://xxx.ngrok-free.app`. Free, but the URL changes every restart.
- **(c) Skip, demo locally** — send the test email to your own inbox on the same machine. Tracking still records.

**Nothing to provide me unless you pick (a) or (b)** — in which case send the public URL.

---

## E. Hackathon-brief gaps — code-only, no new keys needed

These are the four spec items I'd want to close before the demo. I do **not** need anything from you to fix them — just your go-ahead. Listed for transparency:

| # | Brief item | Status | Fix |
|---|---|---|---|
| 1 | Contact Intelligence → **Phone numbers** | ❌ missing | Hunter free tier does not return phones, and the free-stack constraint rules out Apollo/Lusha. Best honest option: dashboard shows "phone unavailable on free stack" badge. **Decision needed from you** — are you OK with this? |
| 2 | Contact Intelligence → **LinkedIn profiles** | 🟡 opportunistic | Update DM extraction prompt + schema to capture a dedicated `linkedinUrl`. ~15 min code change. |
| 3 | Competitor Mapping → split *current activity* / *strengths & gaps* | 🟡 collapsed | Split `Competitor` schema into `{name, current_activity, strengths_and_gaps, citations}`. ~15 min. |
| 4 | Experiential & Events → split *format / scale / outcomes* | 🟡 collapsed | Split events schema into `{title, date, format, scale, outcomes, citations}`. ~15 min. |

---

## F. What I need from you, in order of priority

1. **`FROM_EMAIL`** — the only blocker. (Section B.1)
2. **Phone-number decision** — leave blank with a "free stack" note, or attempt regex scrape from snippets? (Section E, row 1)
3. **(Optional) Public `APP_URL`** if you want live tracking during the demo. (Section C / D)
4. **(Optional) Random `TRACKING_SECRET`** — or say "generate one". (Section C.2)

Reply with #1 and #2 and I'll wire `FROM_EMAIL` in, ship LinkedIn / competitor / events fixes (E.2–E.4), and the system is jury-ready.
