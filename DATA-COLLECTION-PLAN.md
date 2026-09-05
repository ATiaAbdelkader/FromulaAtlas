# Data Collection Plan — Algerian Plant Disease Dataset

**Goal:** Build a labeled dataset of Algerian field photos for future CNN training.
**Why:** No public dataset of Algerian crop diseases exists. PlantVillage (the standard) is lab photos on neutral backgrounds — models trained on it fail on real field photos. The feedback loop we just shipped (`DiagnosisFeedback` table) is how we close this gap.

---

## The asset we're building

A Postgres table (`DiagnosisFeedback`) that accumulates:

| Field | Example | Use |
|---|---|---|
| `diagnosisId` | `diag_1693939200_abc123` | Client-generated UUID |
| `problemType` | `disease` | Filter by type |
| `problemName` | `Bayoud Disease` | The AI's prediction |
| `confidence` | `0.72` | How confident the AI was |
| `wasCorrect` | `false` | Farmer's verdict |
| `correctDiagnosis` | `Actually Fusarium wilt, not Bayoud` | Ground truth label |
| `crop` | `Date Palm` | Crop context |
| `imageUrl` | `https://...` (future) | The actual photo |
| `farmerId` | `clxyz...` | Attribution + quality signal |
| `notes` | `Found in 3 palms in south field` | Extra context |

Every row is a **labeled training example**. After 6-12 months, we'll have enough to train a CNN that outperforms the zero-shot Gemini approach on Algerian-specific diseases.

---

## The pipeline (5 stages)

### Stage 1: Passive collection (NOW — shipped)
- Farmer uses AI Field Scout → gets diagnosis
- UI asks "Was this correct?" (Yes/No buttons)
- If "No": farmer types the actual diagnosis → stored as `correctDiagnosis`
- If "Yes": stored as `wasCorrect=true`
- **No image stored yet** — only the prediction + verdict. This is the lowest-friction collection.

**Expected volume:** ~50 feedback rows/month at 100 active farmers.

### Stage 2: Image storage (Month 2-3 — when we have budget for S3/R2)
- Upload the photo to Cloudflare R2 or AWS S3 before calling the API
- Store the image URL in `DiagnosisFeedback.imageUrl`
- Now every row has both the prediction AND the photo it was based on
- This is the dataset that has real value

**Expected volume:** ~200 labeled images/month at 100 active farmers.

### Stage 3: Expert verification (Month 4-6 — when we have agronomist partners)
- Pilot cooperative agronomists get access to `/admin/diagnosis-review`
- They see the photo + AI diagnosis + farmer feedback
- They mark it: `verified_correct` / `verified_incorrect` / `uncertain`
- Verified rows get a `verifiedBy` field — these are the gold-standard labels
- Agronomist-verified rows are worth 10× unverified rows for training

**Expected volume:** ~50 verified images/month (bottlenecked by agronomist time).

### Stage 4: Active collection drives (Month 6-12 — targeted campaigns)
- "Help us improve: send us photos of [specific disease] this season"
- Push via WhatsApp brief: "We're collecting Bayoud disease photos from date palm farmers — your photo helps Algerian agriculture"
- Gamify: farmers who submit 10+ verified photos get a "Contributor" badge + 1 month free Pro

**Expected volume:** ~500 images per targeted drive.

### Stage 5: CNN training (Month 12+ — when we have 5,000+ verified images)
- Export the verified images + labels as a dataset
- Train a custom CNN (EfficientNet B0 or MobileNetV3 — lightweight enough for edge deployment)
- Deploy as a Python microservice (FastAPI on Railway/Render)
- Wire `/api/identify-symptom` to call the CNN first, fall back to Gemini if confidence is low
- The CNN will be better than Gemini on Algerian-specific diseases (Bayoud, etc.) because it's trained on real Algerian photos

---

## Privacy + consent

- **Image consent:** Stage 2 requires explicit opt-in. The upload UI will show: "I consent to FormulaAtlas using this photo to improve disease detection for Algerian farmers. My photo may be used to train AI models. I can withdraw this consent anytime by emailing privacy@formulaatlas.dz."
- **Anonymization:** `farmerId` is stored but never published with the dataset. If we ever publish the dataset (e.g., as an open-source contribution), all farmer IDs are stripped.
- **Withdrawal:** Farmers can request deletion of their feedback via `privacy@formulaatlas.dz`. We delete the row within 30 days.
- **No PII in images:** The upload UI warns: "Ensure the photo contains only the plant — no faces, no license plates, no identifiable backgrounds."

---

## Quality controls

1. **Confidence threshold:** Only feedback on diagnoses with confidence 0.4-0.9 is valuable. Too low = AI didn't know. Too high = trivial case.
2. **Duplicate detection:** Same farmer + same diagnosisId = update, not insert.
3. **Spam filtering:** If a farmer submits >20 feedback rows/day, flag for review.
4. **Cross-validation:** If 3+ farmers mark the same diagnosis as "incorrect" with the same `correctDiagnosis`, that's a strong signal the AI is systematically wrong on that disease.

---

## Metrics to track (in PostHog + admin dashboard)

| Metric | Target (Month 6) | Target (Month 12) |
|---|---|---|
| Total feedback rows | 500 | 5,000 |
| With images | 300 | 3,000 |
| Agronomist-verified | 50 | 500 |
| AI accuracy (per disease) | Baseline established | +10% improvement |
| Diseases with >50 labeled images | 5 | 15 |

---

## What this enables (the moat)

After 12 months, FormulaAtlas will have:

1. **The only labeled dataset of Algerian field crop diseases** — no competitor has this. It's a geographic + domain moat.
2. **A CNN that outperforms Gemini on Algerian crops** — because it's trained on real Algerian photos, not lab photos.
3. **A publishable dataset** — contributing it open-source (anonymized) positions FormulaAtlas as the research leader in Algerian agtech.
4. **A monetizable asset** — the dataset + model can be licensed to cooperatives, government, and other agtech companies.

This is the long-term competitive advantage. The WhatsApp brief gets farmers in the door; the feedback loop turns their usage into a dataset no one else can build.

---

## Immediate next steps (when you have time)

1. **Monitor feedback volume** — check `/admin` → diagnosis feedback stats weekly
2. **Identify the top 3 misdiagnosed diseases** — these are the highest-value targets for the first active collection drive
3. **Find an agronomist partner** — a single agronomist reviewing 10 photos/week = 500 verified images/year
4. **Plan the image storage integration** — Cloudflare R2 has a generous free tier (10GB/month egress)
