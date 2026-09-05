# FormulaAtlas Deployment Guide

**Audience:** You (the founder), when you're ready to go live.
**Time required:** 1-2 hours of focused work + 2-5 days waiting for Meta template review.
**Cost at launch:** $0/month (Vercel Hobby + Vercel Postgres free + Open-Meteo free)

This guide covers the full path from "code is on GitHub" to "farmers are receiving WhatsApp briefs and paying via CIB."

---

## Phase 0: Prerequisites

Before you start, you need:

- [ ] The latest code pushed to `https://github.com/ATiaAbdelkader/FromulaAtlas.git`
- [ ] A Vercel account (free at https://vercel.com — sign in with GitHub)
- [ ] A Meta Business Account (we'll create this in Phase 2)
- [ ] An Algerian SIM card you can receive SMS on (for WhatsApp Business verification)
- [ ] A Chargily account (free at https://chargily.com — for payments)
- [ ] A domain name (optional but recommended — looks more professional than `*.vercel.app`)

---

## Phase 1: Deploy to Vercel (30 min)

### 1.1 Import the repo
1. Go to https://vercel.com/new
2. Select your GitHub account → find `ATiaAbdelkader/FromulaAtlas`
3. Click **Import**

### 1.2 Configure the project
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `./` (default)
- **Build Command:** `prisma generate && next build` (should be auto-detected from `package.json`)
- **Install Command:** `npm ci` (default)

### 1.3 Add environment variables
In the Vercel project settings → **Environment Variables**, add these one by one.
**Important:** Set them for all environments (Production + Preview + Development).

#### Required (even for Foundation mode)
```
DATABASE_URL=<we'll set this in Phase 1.4>
NEXTAUTH_SECRET=<generate with: openssl rand -hex 32>
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

#### WhatsApp (Foundation mode — leave defaults)
```
WHATSAPP_SEND_MODE=stub
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v21.0
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
CRON_SECRET=<generate with: openssl rand -hex 32>
```

#### Admin
```
ADMIN_SECRET=<generate with: openssl rand -hex 32>
```

#### Chargily (Foundation mode — leave empty)
```
CHARGILY_SECRET_KEY=
CHARGILY_WEBHOOK_SECRET=
```

### 1.4 Create Vercel Postgres database
1. In your Vercel project → **Storage** tab → **Create Database**
2. Select **Postgres (Serverless Postgres)** — Free tier
3. Name it `formulaatlas-db`
4. Region: **Frankfurt (eu-central-1)** — closest to Algeria with low latency
5. Click **Create**
6. Vercel auto-adds `DATABASE_URL` and related env vars to your project

### 1.5 Deploy
1. Click **Deploy** in Vercel
2. Wait 2-3 minutes for the build to complete
3. Visit `https://your-app.vercel.app` — you should see the landing page

### 1.6 Create database tables
After the first deploy, you need to create the Prisma tables in Postgres:

**Option A (recommended):** Use Vercel's database CLI
```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Link your project
cd /path/to/FromulaAtlas
vercel link

# Pull env vars locally
vercel env pull .env.local

# Run Prisma migration
npx prisma db push
```

**Option B:** Use the Vercel dashboard
1. Go to Storage → your Postgres database → **Query**
2. Run the SQL from `prisma/migrations/init.sql` (you'll need to generate this — see below)

To generate the SQL:
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/init.sql
```

### 1.7 Verify
- Visit `https://your-app.vercel.app/auth` — phone auth page should load
- Visit `https://your-app.vercel.app/privacy` — privacy policy should load
- Visit `https://your-app.vercel.app/admin` — should ask for `ADMIN_SECRET` (enter the one you set)
- In the admin dashboard, you should see: `0 farmers, 0 active subs, stub mode`

✅ **Foundation mode is now live.** Users can sign up, subscribe to briefs, and the cron logs briefs to the DB (but doesn't send WhatsApp messages yet).

---

## Phase 2: WhatsApp Business setup (2-5 days wall-clock)

This is the long pole — start it early. While Meta reviews your templates, you can do Phase 3 (Chargily) in parallel.

### 2.1 Create Meta Business Account
1. Go to https://business.facebook.com
2. Click **Create Account**
3. Business name: `FormulaAtlas`
4. Your name + business email
5. Complete the verification (Meta may ask for ID — driver's license or passport)

### 2.2 Add WhatsApp Business
1. In Meta Business Manager → **WhatsApp Business** → **Get Started**
2. Select your business
3. **Phone number setup:**
   - **Option A (rent from Meta — instant):** ~$5-10/month, US/UK number
   - **Option B (local Algerian SIM — recommended):** Buy a Mobilis/Djezzy SIM, register it. Looks more local, higher open rates.
4. If using Option B: insert the SIM in a phone, receive the SMS verification code from Meta during setup
5. Note down the **Phone Number ID** (you'll need it later)

### 2.3 Submit message templates for review
Meta requires pre-approved templates for business-initiated messages.
Go to **WhatsApp Manager → Message Templates → Create Template**.

Submit these 4 templates (in English + French + Arabic):

#### Template 1: `daily_brief_v1` (Utility category)
```
Body:
{{1}}

— Sent from Formula Atlas 🌾
Reply STOP to unsubscribe.
```
- Category: **Utility**
- Parameters: 1 (the brief message body)

#### Template 2: `otp_verify_v1` (Authentication category)
```
Body:
Your FormulaAtlas verification code is {{1}}. Valid for 10 minutes. Do not share this code with anyone.
```
- Category: **Authentication**

#### Template 3: `welcome_v1` (Utility category)
```
Body:
Welcome to FormulaAtlas daily brief, {{1}}! You'll receive your first brief tomorrow at {{2}}. Reply STOP to unsubscribe anytime.
```
- Category: **Utility**

#### Template 4: `unsubscribe_confirmation_v1` (Utility category)
```
Body:
You've been unsubscribed from FormulaAtlas daily briefs. We won't message you again. Reply START to resubscribe.
```
- Category: **Utility**

**Wait 2-5 days** for Meta to review. You'll get an email when approved.

### 2.4 Get API credentials
Once templates are approved:
1. Go to **WhatsApp Manager → API Setup**
2. Copy the **Access Token** (permanent system user token — not a temporary one)
3. Copy the **Phone Number ID**
4. Go to **App Settings → Basic** → copy the **App Secret**

### 2.5 Configure webhook
1. Go to **WhatsApp Manager → Configuration → Webhook**
2. **Callback URL:** `https://your-app.vercel.app/api/whatsapp/webhook`
3. **Verify Token:** any random string you choose (e.g., `openssl rand -hex 16`)
4. Click **Verify and Save** (this calls your GET endpoint)
5. Subscribe to fields: `messages`, `message_status`, `message_delivered`, `message_read`

### 2.6 Flip to live mode
In Vercel → Environment Variables, update:
```
WHATSAPP_SEND_MODE=live
WHATSAPP_ACCESS_TOKEN=<from step 2.4>
WHATSAPP_PHONE_NUMBER_ID=<from step 2.4>
WHATSAPP_APP_SECRET=<from step 2.4>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<from step 2.5>
```

Then **Redeploy** in Vercel (Deployments → latest → Redeploy).

### 2.7 Verify
1. Visit `/admin` → should show `live mode` badge
2. Add yourself as a test farmer:
   - Visit `/auth`, sign in with your phone
   - Visit `/subscribe`, subscribe to briefs
3. Wait until 06:30 Algeria time tomorrow
4. You should receive a real WhatsApp brief

✅ **WhatsApp is live.**

---

## Phase 3: Chargily payment setup (1-2 hours)

### 3.1 Create Chargily account
1. Go to https://chargily.com → **Sign Up**
2. Verify your email
3. Complete business verification (need a business registration — Algerian RC number)

### 3.2 Get API keys
1. Go to **Dashboard → API → API Keys**
2. Copy **Secret Key** (starts with `test_` for test mode, `live_` for production)
3. Copy **Webhook Secret** (separate from API key)

### 3.3 Configure webhook
1. Go to **Dashboard → Webhooks → Add**
2. **URL:** `https://your-app.vercel.app/api/chargily/webhook`
3. **Events:** `checkout.session.paid`, `checkout.session.failed`
4. Save → note the Webhook Secret

### 3.4 Set env vars in Vercel
```
CHARGILY_SECRET_KEY=live_xxxxxxxxxxxxxxxxxxxxx
CHARGILY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxx
```

Redeploy.

### 3.5 Test a payment
1. Visit `/pricing` while logged in
2. Click **Subscribe** on the Pro plan
3. You'll be redirected to Chargily's checkout page
4. Pay with a test CIB card (Chargily provides test cards in their docs)
5. You should be redirected to `/payment-success`
6. Visit `/admin` — you should see your ProSubscription activated

✅ **Payments are live.**

---

## Phase 4: Custom domain (optional, 30 min)

A custom domain (e.g., `formulaatlas.dz`) looks more professional and is required for some payment gateways.

### 4.1 Buy a domain
- `.dz` domains: register at https://www.nic.dz (requires Algerian ID)
- Or use a `.com` from any registrar (Namecheap, Cloudflare, etc.)

### 4.2 Add to Vercel
1. Vercel project → **Settings → Domains**
2. Add your domain
3. Follow Vercel's instructions to update DNS records at your registrar

### 4.3 Update env var
In Vercel, update:
```
NEXT_PUBLIC_BASE_URL=https://formulaatlas.dz
```

### 4.4 Update Meta webhook
Go back to WhatsApp Manager → Configuration → Webhook → edit URL to:
`https://formulaatlas.dz/api/whatsapp/webhook`

### 4.5 Update Chargily webhook
Same — update to `https://formulaatlas.dz/api/chargily/webhook`

---

## Phase 5: Vercel Cron setup

Vercel Cron is already configured in `vercel.json`:
```json
"crons": [{"path": "/api/cron/daily-brief", "schedule": "30 5 * * *"}]
```

But Vercel needs to know the `CRON_SECRET` to authenticate the cron request.

### 5.1 (Already done) Set CRON_SECRET
You set this in Phase 1.3. Vercel automatically injects it as the `x-cron-secret` header when triggering the cron.

### 5.2 Verify cron is registered
1. Vercel project → **Settings → Cron Jobs**
2. You should see: `/api/cron/daily-brief` at `30 5 * * *` (daily at 05:30 UTC = 06:30 Algeria)

### 5.3 Trigger a manual test
To test without waiting until 06:30:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-brief \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

You should get back `{"sent":0,"failed":0,"skipped":0,"total":0,"durationMs":42}` (or similar).

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is set in Vercel env vars
- Check it's the Postgres connection string (starts with `postgres://`, not `file:`)
- Run `npx prisma db push` again after env var changes

### "WhatsApp verification failed"
- Make sure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in Vercel matches what you entered in Meta dashboard
- Check Vercel function logs: Vercel → Deployments → latest → **Functions** → `/api/whatsapp/webhook`

### "Cron isn't running"
- Vercel Hobby only allows 2 cron jobs — we use 1, should be fine
- Check Vercel → Settings → Cron Jobs to confirm it's registered
- Manually trigger via curl (see Phase 5.3)

### "Briefs sent=0 in admin"
Possible causes:
1. No subscriptions with `nextSendAt <= now()` — check `/admin` for active subs
2. All farmers skipped (no farm profile) — check BriefLog table for SKIPPED entries
3. `WHATSAPP_SEND_MODE` is still `stub` (stub mode logs but the count shows under SENT — check `sendMode` field)

### "Payment not working"
- Check `CHARGILY_SECRET_KEY` starts with `live_` (not `test_`)
- Verify webhook signature: check Vercel function logs for `/api/chargily/webhook`
- Make sure your Chargily account is verified (not in test mode)

---

## Switch-on summary

When you're ready to go from Foundation → Live, here's the checklist:

| Step | What | Where |
|---|---|---|
| 1 | Create Vercel project + Postgres DB | vercel.com |
| 2 | Set `DATABASE_URL` + run `prisma db push` | Local + Vercel |
| 3 | Set `NEXTAUTH_SECRET`, `CRON_SECRET`, `ADMIN_SECRET`, `NEXT_PUBLIC_BASE_URL` | Vercel env vars |
| 4 | Create Meta Business Account + WhatsApp Business number | business.facebook.com |
| 5 | Submit 4 message templates + wait for review | WhatsApp Manager |
| 6 | Configure WhatsApp webhook (URL + verify token) | WhatsApp Manager |
| 7 | Set `WHATSAPP_*` env vars + flip `WHATSAPP_SEND_MODE=live` | Vercel env vars |
| 8 | Create Chargily account + get API keys | chargily.com |
| 9 | Configure Chargily webhook | Chargily dashboard |
| 10 | Set `CHARGILY_*` env vars | Vercel env vars |
| 11 | Redeploy | Vercel |
| 12 | Test: sign up yourself, subscribe, wait for 06:30 brief | Browser |

**Total dev time:** ~2 hours.
**Total wall-clock:** ~1 week (Meta template review dominates).

---

## Cost at scale

| Farmers | Vercel | Postgres | Open-Meteo | WhatsApp | Chargily | **Total/mo** |
|---|---|---|---|---|---|---|
| 100 | $0 (Hobby) | $0 (free) | $0 | $36 (100×$0.36) | 0% (free users) | **$36** |
| 500 | $0 (Hobby) | $0 (free) | $0 | $180 (500×$0.36) | ~$10 (4 Pro) | **$190** |
| 1000 | $20 (Pro) | $0 (free) | $0 | $360 (1000×$0.36) | ~$25 (10 Pro) | **$405** |
| 5000 | $20 (Pro) | $20 (Pro) | $0 | $1800 | ~$130 (50 Pro) | **$1970** |

Break-even: **4 Pro subscribers ($44/mo revenue) cover 100 free farmers ($36/mo cost).**
At 1000 farmers with 10 Pro subs, you're profitable.
