# WhatsApp Outbound Backend — Scope Document

**Status:** Revised — Foundation mode approved 2026-09-04
**Author:** Super Z
**Date:** 2026-09-04
**Predecessor work:** Features #7 (WhatsApp brief UI), #8 (push notification scheduler), #9 (crop ID unification)

---

## 0. Foundation mode (current operating mode)

**Constraint:** No funding yet. Everything must run on free tiers with zero ongoing cost. When funding arrives, the WhatsApp send capability should be switchable with **one env var flip** (`WHATSAPP_SEND_MODE=live`) + a Meta Business Account setup — no code changes, no migrations.

### What we build now (zero cost, all on free tiers)
- ✅ Postgres migration (Vercel Postgres free tier — 256MB, sufficient for ~10K farmers)
- ✅ Prisma schema for `Farmer`, `Subscription`, `BriefLog` (tables exist, no live data)
- ✅ Phone-based auth via NextAuth (credentials provider, OTP logic stubbed — phone format validation only, no actual OTP send)
- ✅ Subscription flow UI (consent checkbox, language picker, time picker) — works end-to-end, marks `Subscription.enabled=true` but doesn't send anything
- ✅ Daily brief pipeline as a Vercel Cron job — runs at 05:30 UTC, computes briefs for all subscribed farmers, **logs them to `BriefLog` with `status=PENDING`** instead of sending
- ✅ WhatsApp client wrapper with a **stub implementation** (`console.log` instead of HTTP call) — same interface as the real one
- ✅ Privacy policy page at `/privacy` (public URL needed for consent flow)
- ✅ Unsubscribe page at `/unsubscribe` (works via link in future briefs)
- ✅ Feature flag `WHATSAPP_SEND_MODE` (default: `stub`) — when set to `live`, the stub swaps to the real Graph API client

### What we defer until funded
- ⏸️ Meta Business Account creation (user-side, ~1 day)
- ⏸️ 4 WhatsApp message templates submitted for review (user-side, 2h work + 2-5 days wait)
- ⏸️ Real WhatsApp Business Cloud API sends (just flip `WHATSAPP_SEND_MODE=live` + set `WHATSAPP_ACCESS_TOKEN` env var)
- ⏸️ OTP-via-WhatsApp (backfill to verify all stored phone numbers once WhatsApp is live)
- ⏸️ Chargily payment integration for Pro tier
- ⏸️ Vercel Pro upgrade (only if we exceed Hobby limits — unlikely until 500+ active users)

### Switch-on cost when funding arrives
The day funding lands, the path to live WhatsApp sends is:
1. Create Meta Business Account (1 day, user-side)
2. Submit 4 templates for review (2h work + 2-5 days wall-clock wait)
3. Buy local SIM in Algeria, register WhatsApp Business number (1 day, user-side)
4. Get `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` from Meta dashboard
5. Set 2 env vars in Vercel: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
6. Flip `WATSAPP_SEND_MODE` from `stub` to `live`
7. Run backfill script to send OTPs to all stored farmers → verify phone ownership
8. First real brief goes out next morning at 06:30

**Total dev time on my side:** ~2 hours. **Total wall-clock:** ~1 week (dominated by Meta review).

### Free-tier budget
| Service | Free tier | Our expected usage at 1000 farmers | Headroom |
|---|---|---|---|
| Vercel Hobby | 100GB-hours serverless / mo | ~5GB-hours (cron + auth routes) | 20× |
| Vercel Postgres | 256MB storage, 60 compute hours | ~50MB (10K rows × 5KB avg) | 5× |
| Vercel Cron (Hobby) | 2 jobs | 1 job (daily brief) | 2× |
| Open-Meteo | 10K calls/day | ~60 calls/day (one per wilaya, cached) | 166× |
| NextAuth | Free (self-hosted) | N/A | ∞ |
| **Total fixed cost** | **$0/month** | | |

We can comfortably support ~1000 free-tier farmers without paying anyone anything. Past 1000, we'd hit Postgres storage limits first — Vercel Pro ($20/mo) lifts that to 1GB and unlocks more cron slots.

---

## 1. Goal & non-goals

### Goal
Convert FormulaAtlas from a "tool the farmer sometimes opens" into a "thing that wakes them up every morning at 06:00 with their farm's status" — delivered via WhatsApp, the channel Algerian farmers already live in.

### Non-goals (for v1)
- Real-time alerts (frost tonight, pest outbreak) — that's v2; v1 is the daily brief only
- Two-way conversation (farmer replies with photos, voice notes) — v3
- Group broadcasts to cooperatives — separate feature, after we prove 1:1 works
- Migration of all 6 localStorage stores to cloud — only the 2 the brief needs (farm profile + plan)
- Webhook receiver for incoming WhatsApp messages — not needed for outbound-only v1

### Success criteria (90 days)
- 100 farmers receiving daily briefs
- 30% daily open rate (measured via a "tap to view full report" link with a tracking param)
- 10 paying Pro subscribers attributable to the brief
- <2% unsubscribe rate

---

## 2. Architecture (high level)

```
┌──────────────────────────────────────────────────────────────────┐
│  Vercel Cron (daily, 05:30 Africa/Algiers)                       │
│  → POST /api/cron/daily-brief                                    │
└─────────────┬────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│  /api/cron/daily-brief  (Next.js route, 60s max duration)        │
│  1. Query subscribed farmers from Postgres                       │
│  2. For each farmer (batched, 50 at a time):                     │
│     a. Fetch weather (Open-Meteo, cached)                        │
│     b. Build brief (reuse whatsapp-daily-brief.ts helpers)       │
│     c. Send via WhatsApp Business Cloud API                      │
│     d. Log send status to Postgres                               │
│  3. Return summary                                               │
└─────────────┬────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Meta Graph API                                                  │
│  POST https://graph.facebook.com/v21.0/{phone_id}/messages       │
└──────────────────────────────────────────────────────────────────┘
```

**Why not a separate worker?** Vercel Cron + a 60s API route handles up to ~500 farmers in one invocation. Past that we'd split into multiple cron slots (05:30, 05:35, 05:40...) or move to a dedicated worker on Railway/Render. Defer that decision until we have 500+ subscribers — premature today.

**Why Vercel Cron over QStash/EasyCron?** Already deploying to Vercel, cron is built-in (free tier = 1 job/day, paid = unlimited). One moving part less.

---

## 3. Decisions to make before writing code

These are open questions. My recommendation is in **bold**; please confirm or override.

### D1. Auth model: phone-only vs. email+phone
- **Option A (phone-only):** WhatsApp number IS the identity. OTP via WhatsApp for login. No email.
- **Option B (email+phone):** Email for account recovery, phone for WhatsApp send.
- **Recommendation: A.** Most Algerian farmers don't have email. Phone is the natural identity. Email can be added later for power users.

### D2. WhatsApp Business number: rent from Meta vs. buy a local SIM
- **Option A (rent from Meta):** ~$5-10/month, instant provisioning, US/UK number.
- **Option B (local SIM):** ~500 DZD (~$3.70) one-time, Algerian number (+213), looks more local.
- **Recommendation: B if you can physically buy and register a SIM in Algeria, otherwise A.** Local numbers get higher open rates (farmers trust +213). But Meta requires the SIM to receive the verification SMS during setup, so someone needs to be in Algeria to do this.

### D3. Database: stay on SQLite vs. migrate to Postgres
- **Option A (SQLite):** Already wired up. Free. Fine for <100 concurrent users. Bad for cron concurrency (single writer).
- **Option B (Postgres):** Vercel Postgres free tier (60h compute/month, 256MB). Production-ready.
- **Recommendation: B.** SQLite will lock when the cron job and a user request collide. Migration is ~2 hours of work (change `provider` in schema.prisma, run `prisma migrate`, update `DATABASE_URL`).

### D4. Where to run the cron: Vercel Cron vs. external
- **Option A (Vercel Cron):** Already deploying there. Free tier = 2 jobs (Hobby) or unlimited (Pro $20/mo).
- **Option B (external like QStash):** $10/mo for 1000 calls, more reliable retries.
- **Recommendation: A for v1.** Switch to B if we hit reliability issues.

### D5. Message template strategy
WhatsApp Business API requires pre-approved templates for business-initiated conversations. We need:
- **Daily brief template** (the main one)
- **OTP template** (for phone verification)
- **Welcome template** (sent once when farmer first subscribes)
- **Confirmation template** (sent after subscription, with unsubscribe instructions)

Meta's template review takes 2 hours to 2 days. Need to submit these early in parallel with code.

### D6. Opt-in compliance
Algeria's data protection law (18-07) is GDPR-inspired. We need:
- Explicit consent checkbox (not pre-ticked)
- Privacy policy link in the consent flow
- One-tap unsubscribe (reply "STOP" or click a link)
- Audit log of when/where they consented

---

## 4. Phased build plan

### Phase 0: WhatsApp Business setup (parallel to Phase 1, ~1 week wall-clock)
**Owner:** You (needs Meta Business Manager access)
- [ ] Create Meta Business Account at https://business.facebook.com
- [ ] Add a WhatsApp Business number (rent from Meta or register local SIM)
- [ ] Submit 4 message templates for review (D5)
- [ ] Get `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`
- [ ] Add a test number to the "verified recipients" list (Meta restricts who you can message before verification is complete)

**Estimated effort:** 2 hours of your time + 2-5 days waiting for Meta review.

### Phase 1: Database migration + minimal user model (~2 days)
- [ ] Migrate Prisma from SQLite to Postgres (D3)
- [ ] Extend schema with `Farmer`, `Subscription`, `BriefLog` models (see §5)
- [ ] Run `prisma migrate dev` to create tables
- [ ] Add `db.ts` singleton to reuse the Prisma client across hot reloads

**Estimated effort:** 1-2 days. No UI changes — just plumbing.

### Phase 2: Phone auth + WhatsApp OTP (~3 days)
- [ ] Install `next-auth` (credentials provider)
- [ ] Build `/api/auth/otp/send` — generates 6-digit code, sends via WhatsApp template, stores hash with 10-min TTL
- [ ] Build `/api/auth/otp/verify` — verifies code, creates or looks up `Farmer` row, returns session token
- [ ] Build `/app/auth` page — phone entry + OTP entry (no email field per D1)
- [ ] Wrap existing localStorage reads with "fall back to DB if logged in" logic for `farm_profile_v1` and `FARMPILOT_PLAN_KEY`

**Estimated effort:** 3 days. No existing UI breaks — logged-out users keep using localStorage.

### Phase 3: Subscription flow (~2 days)
- [ ] Build `/app/subscribe` page — shows consent checkbox, language picker (EN/FR/AR), time picker (default 06:00), CTA "Send me a daily WhatsApp brief"
- [ ] On submit: write `Subscription` row with `consentedAt`, `consentIp`, `preferredTime`, `language`
- [ ] Send welcome template via WhatsApp
- [ ] Build `/app/unsubscribe` page — accessible via link in every brief

**Estimated effort:** 2 days. Depends on Phase 2.

### Phase 4: Daily brief pipeline (~4 days)
- [ ] Add `vercel.json` cron config: `{"crons": [{"path": "/api/cron/daily-brief", "schedule": "30 5 * * *"}]}` (05:30 UTC = 06:30 Africa/Algiers — leaves 30 min buffer before 06:00 send)
- [ ] Build `/api/cron/daily-brief` route:
  - Auth via `CRON_SECRET` header (prevent public access)
  - Query subscriptions where `nextSendAt <= now()`
  - Batch in groups of 50 (Meta rate limit is 80 msg/sec, but we throttle for safety)
  - For each: fetch weather, build brief, send via Graph API, log result, schedule next send
  - Return JSON summary `{sent, failed, skipped}`
- [ ] Build `/lib/whatsapp-client.ts` — thin wrapper around Graph API (sendTemplate, sendText, verifyNumber)
- [ ] Reuse `buildBriefMessage()` from `whatsapp-daily-brief.tsx` (already exported + tested)
- [ ] Add Open-Meteo response caching (5-min TTL via `lru-cache`) — one weather fetch per wilaya, not per farmer

**Estimated effort:** 4 days. Depends on Phases 1-3 + Phase 0.

### Phase 5: Unsubscribe + reply handling (~2 days)
- [ ] Build `/api/whatsapp/webhook` — receives inbound messages + status updates from Meta
- [ ] Handle "STOP" / "إيقاف" / "STOP" replies → set `Subscription.unsubscribedAt`
- [ ] Handle delivery / read receipts → update `BriefLog` status
- [ ] Configure webhook URL in Meta Business Manager

**Estimated effort:** 2 days. Can ship after Phase 4 if needed.

**Total estimated effort:** 13-15 working days, with Meta review (Phase 0) as the long-pole.

---

## 5. Data model changes

Add to `prisma/schema.prisma`:

```prisma
model Farmer {
  id            String         @id @default(cuid())
  phoneE164     String         @unique  // "+213661234567"
  displayName   String?
  language      Language       @default(AR)  // EN | FR | AR
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  lastLoginAt   DateTime?
  subscription  Subscription?
  briefLogs     BriefLog[]
}

model Subscription {
  id              String    @id @default(cuid())
  farmerId        String    @unique
  farmer          Farmer    @relation(fields: [farmerId], references: [id])
  enabled         Boolean   @default(true)
  preferredTime   String    @default("06:00")  // "HH:MM" 24h, Africa/Algiers
  consentedAt     DateTime  @default(now())
  consentIp       String?
  consentVersion  String    @default("1.0")    // privacy policy version
  unsubscribedAt  DateTime?
  nextSendAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([enabled, nextSendAt])
}

model BriefLog {
  id              String    @id @default(cuid())
  farmerId        String
  farmer          Farmer    @relation(fields: [farmerId], references: [id])
  sentAt          DateTime  @default(now())
  messageId       String?   // Meta's message ID for status tracking
  status          BriefStatus @default(PENDING)  // PENDING | SENT | DELIVERED | READ | FAILED
  errorMessage     String?
  briefPreview    String    // First 200 chars, for debugging
  weatherSource   String    // "open-meteo" | "atlas_default"
  briefLength     Int

  @@index([farmerId, sentAt])
  @@index([status])
}

enum Language {
  EN
  FR
  AR
}

enum BriefStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}
```

**Notes:**
- `phoneE164` is the canonical phone format (+213XXXXXXXXX). Store normalized, never display format.
- `Subscription` is 1:1 with `Farmer` for v1 — one brief per farmer. v2 can add multiple subscriptions (e.g., one per field).
- `BriefLog` is append-only — never delete, only update `status`. This is the audit trail.
- `nextSendAt` is computed daily based on `preferredTime` — set after each send to tomorrow's slot.
- `consentVersion` lets us re-consent users if the privacy policy changes materially.

---

## 6. WhatsApp Business API specifics

### Authentication
Meta uses a permanent `WHATSAPP_ACCESS_TOKEN` (system user token, not a user token — survives personnel changes). Store as a Vercel env var.

### Send a template message
```ts
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "213661234567",
  "type": "template",
  "template": {
    "name": "daily_brief_v1",
    "language": { "code": "ar" },  // or "en", "fr"
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "أحمد" },           // farmer name
          { "type": "text", "text": "البطاطا" },         // crop
          { "type": "text", "text": "32°C → 18°C" },    // weather
          { "type": "text", "text": "60 م³" },           // irrigation
          { "type": "text", "text": "https://..." }     // link to full report
        ]
      }
    ]
  }
}
```

### Message templates to submit for review
Submit all 4 in EN + AR + FR. Meta's review is per-language.

1. **`daily_brief_v1`** (utility category — lowest cost)
   ```
   {{1}}, here's your brief for {{2}} today:
   🌤 Weather: {{3}}
   💧 Irrigation: {{4}}
   Tap to see full report: {{5}}
   Reply STOP to unsubscribe.
   ```

2. **`otp_verify_v1`** (authentication category)
   ```
   Your FormulaAtlas verification code is {{1}}. Valid for 10 minutes. Do not share.
   ```

3. **`welcome_v1`** (utility)
   ```
   Welcome to FormulaAtlas daily brief, {{1}}! You'll receive your first brief tomorrow at {{2}}. Reply STOP to unsubscribe anytime.
   ```

4. **`unsubscribe_confirmation_v1`** (utility)
   ```
   You've been unsubscribed from FormulaAtlas daily briefs. We won't message you again. Reply START to resubscribe.
   ```

### Rate limits
- New WhatsApp Business accounts start at **Tier 1: 1K business-initiated conversations per 24 hours**
- Auto-upgrades to Tier 2 (10K) after 30 days if quality is good
- Per-second: ~80 messages/sec per phone number
- For v1 (target: 100-1000 farmers): we're well within Tier 1. Send in batches of 50 with 1-sec pauses.

### Number verification (before sending)
Always call Meta's `GET /v21.0/{phone_id}/contacts?phone=...` to verify the number is on WhatsApp before storing it as `phoneE164`. Saves us sending to dead numbers.

---

## 7. Costs & break-even

### Per-farmer monthly cost
- WhatsApp Business number: ~$5-10/month (fixed, doesn't scale with users)
- Daily brief send: ~$0.012 per utility message × 30 days = **$0.36/farmer/month**
- Open-Meteo weather: free (1K calls/day limit — covers 1000 farmers easily)
- Vercel hosting: free (Hobby) up to 100GB-hours, then $20/month Pro
- Postgres: Vercel free tier (256MB) → sufficient for ~10K farmers

### Break-even
| Tier | Price | Margin per farmer |
|---|---|---|
| Free (1 field, brief) | 0 DZD | -$0.36/mo (loss leader) |
| Pro (multi-field, NDVI, PDF) | 1,500 DZD (~$11) | +$10.64/mo |
| Cooperative | 15,000 DZD (~$110) | depends on members |

**Break-even math:**
- 100 free farmers cost us $36/month
- 1 Pro subscriber earns $10.64/month
- So **4 Pro subscribers cover 100 free farmers**
- **28 Pro subscribers cover 1000 free farmers**

That's an aggressive, healthy ratio. Free tier is sustainable as a growth lever.

### Initial capital needed
- WhatsApp Business number: ~$10/month
- Vercel Pro (if we exceed Hobby): $20/month
- Chargily payment integration: 2% per transaction, no monthly fee
- **Total fixed cost to launch: $30/month**

---

## 8. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Meta template review rejects our templates | Medium | High (blocks launch) | Submit early in Phase 0; have backup copy ready; don't use URL shorteners (Meta flags them) |
| Farmers don't open the brief | Medium | Critical (kills the whole thesis) | Track link clicks from day 1; A/B test template wording; send at 05:55 vs 06:00 vs 06:05 |
| Vercel Cron latency under load | Low | Medium | Split into multiple cron slots past 500 farmers; move to QStash if needed |
| Algerian number blocked by Meta (rare but happens for new SIMs) | Low | High | Use rented Meta number as fallback if local SIM gets flagged |
| User reports us as spam to Meta | Low | Critical (account suspension) | Strict opt-in compliance; one-tap unsubscribe; never message outside consented window |
| Open-Meteo rate limit (1K/day) | Low | Medium | Cache weather per wilaya (one fetch covers all farmers in same wilaya); fall back to Atlas default |
| Phone number formatting errors | High | Low | Always normalize to E.164 before storing; verify with Meta's contact check API |
| Database lock under concurrent cron + user writes (SQLite) | High | Medium | D3 — migrate to Postgres before Phase 4 |

---

## 9. What I'd ship in week 1

If you approve this scope, week 1 is:

**Day 1-2 (me):** Phase 1 — Postgres migration + Prisma schema extension. Ship to `main` behind a feature flag (no UI changes yet, existing localStorage flows still work).

**Day 1 (you, in parallel):** Phase 0 kickoff — create Meta Business Account, submit the 4 message templates for review. The review is the long pole; starting it day 1 unblocks everything.

**Day 3-5 (me):** Phase 2 — phone auth + WhatsApp OTP. By end of week 1, a farmer can:
1. Visit `/app/auth`
2. Enter their phone
3. Receive a WhatsApp OTP
4. Verify it
5. See their farm profile (synced from localStorage if they had one, or fresh)

End of week 1 deliverable: **a working phone-auth flow that sends a real WhatsApp message.** That's the riskiest technical piece — if we can send one WhatsApp message, we can send 1000.

Week 2: Phases 3 + 4 (subscription flow + daily pipeline). End of week 2: 1 farmer receiving a daily brief at 06:00.

Week 3: Phase 5 (webhook + unsubscribe) + Chargily payment integration for Pro tier. End of week 3: ready to onboard the first 10 beta farmers.

---

## 10. Open questions for you

1. **Can you be in Algeria to register a local SIM, or should we rent from Meta?** (D2)
2. **Do you have a Meta Business Account already, or do we need to create one?** (Phase 0)
3. **Is Postgres OK, or do you want to stick with SQLite for now?** (D3) — I strongly recommend Postgres.
4. **What's the legal entity behind this?** Meta Business Account requires a verified business. If you don't have one yet, we can start with a personal Business Account and migrate later (Meta allows this).
5. **Privacy policy URL** — we need a public URL for the consent flow. Do you have a draft, or should I write one?
6. **What's your target launch date?** The 13-15 day estimate assumes no blockers; realistically add 5 days for Meta review + iteration.

---

## 11. What I will NOT build (defer to v2)

- Inbound message handling beyond "STOP" (no replying with photos, no natural-language queries)
- Multi-field subscriptions (one brief per farmer for v1, even if they have multiple fields)
- Cooperative group broadcasts
- Real-time weather alerts (frost tonight, etc.) — daily brief only
- Rich media briefs (images, PDFs attached) — text + link only for v1
- A/B testing infrastructure (manual template changes for now)
- Admin dashboard for send metrics (SQL queries against `BriefLog` for now)
