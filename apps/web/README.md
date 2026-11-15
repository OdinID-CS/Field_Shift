# Field Shift Web App (`apps/web`)

Installable Next.js (App Router, TypeScript, Tailwind CSS) web application for farmers, agricultural extension officers, and hackathon demos. It reads precomputed Earth-observation features, phenology calendars, and crop knowledge from Supabase, and runs transparent multi-criteria scoring and Monte Carlo rank-stability checks in TypeScript (`src/lib/scoring.ts`) or via the optional FastAPI service (`apps/api`).

## Current Implementation Status

- **Implemented now:**
  - Deterministic weighted-sum scoring (`baseScores`) and Monte Carlo rank-stability simulation (`rankProbabilities`) in `src/lib/scoring.ts`.
  - Cross-language parity unit tests in `src/lib/scoring.test.ts` validating `1e-9` agreement against `../../shared/test-vectors/scoring_basic.json`.
  - Strategy comparison cards for a baseline and Strategies A–C, including weighted criteria scores, Monte Carlo rank probabilities, benefits, gaps, and risks.
  - Evidence Passport dialogs and interactive inline glossary explanations.
  - `/api/chat` route handler (`src/app/api/chat/route.ts`) combining OpenRouter natural-language synthesis with deterministic MCDA pipeline scoring for the mobile AI Advisor Chat modal.
  - Supabase reads aligned with `supabase/migrations/20261114000000_phase1_schema.sql`; without configured/available Supabase, the decision UI uses clearly labelled illustrative fixtures. Map tiles remain illustrative placeholders.
- **Planned feature set (below):** Core hackathon screens and stretch capabilities compiled from `README.md`, `dev-docs/Field Shift ML Workflow.md`, and `dev-docs/Field_Shift_Team_Stack_Plan.xlsx`.

---

## Feature Set Specification

### 1. Farm Context & Priority Input
- Select a farm cell or location within the 50 × 50 km **Ashanti Region, Ghana** pilot grid.
- Enter the farmer's **existing crop rotation** (baseline strategy, e.g., continuous maize or maize–fallow; perennial systems such as cocoa handled separately).
- Adjust **farmer priority weights** across scoring criteria:
  - Water-use efficiency
  - Drought and heat exposure
  - Soil health (nitrogen fixation, organic matter)
  - Erosion protection
  - Pest and disease-cycle disruption
  - Income and market suitability
  - Labour and equipment fit
  - Seasonal-window fit

### 2. Seasonal Vulnerability & Bare-Field Calendar (M3 + M1)
- Dekad-by-dekad (10-day) seasonal timeline combining:
  - **Rainfall reliability**, onset timing, and dry-spell risk (GPM IMERG / ERA5 / CHIRPS)
  - **Surface soil moisture anomalies** (SMAP)
  - **Smoothed NDVI phenology** (green-up, peak, senescence, and bare-field periods from Landsat/HLS + MODIS/VIIRS)
  - **Heat-stress days** (NASA POWER / ECOSTRESS) and **terrain erosion exposure** (SRTM slope)
- Anomaly indicators flagging unusual historical seasons (Isolation Forest + z-score baseline from M1) validated against seasons local farmers recall as bad.

### 3. Interactive Map Explorer & Scale-Honesty Layer
- Interactive layers via **MapLibre GL** (`react-map-gl`) and time-series charts via **Recharts** for vegetation (NDVI/EVI), soil moisture, rainfall, and terrain slope.
- **Scale-honesty layer:** Compares each dataset's native pixel footprint (e.g., ~30 m Landsat/HLS and SRTM vs. 250 m–1 km MODIS/VIIRS and ~9–36 km SMAP/IMERG) against the smallholder farm area and explicitly flags when coarse pixels provide regional context rather than field-level measurement.

### 4. Rotation Strategy Comparison Cards & Rank Stability (M6)
- Side-by-side comparison cards for **at least three strategies including the farmer's baseline**, such as:
  - **Baseline:** Existing farmer rotation
  - **Strategy A:** Cereal–legume rotation (e.g., maize alternating with cowpea, groundnut, or soybean)
  - **Strategy B:** Soil-cover emphasis (cover crop or mulch phases to shrink bare-field exposure on slopes)
  - **Strategy C:** Water-resilience emphasis (drought-tolerant crops/varieties and rainfall-aligned planting windows)
- Each card reports deterministic weighted priority fit (`baseScores`), **Monte Carlo rank probabilities** (`rankProbabilities`, e.g., *"Strategy A ranks first in 71% of perturbed runs"*), expected benefits, information gaps, and confidence flags.

### 5. Climate Stress-Testing & Analog Season Replay (M2 + M5)
- **What-if sliders** to perturb rainfall and temperature assumptions and observe whether strategy rankings hold or flip.
- **Historical analog replay** powered by nearest-neighbour season clustering (M2: e.g., replay the driest, wettest, or hottest season on record without making deterministic weather forecasts).
- *Stretch (M5):* Instant scenario stress estimates from a quantile-output LightGBM surrogate trained on AquaCrop-OSPy simulations (always clearly labelled as simulated).

### 6. Evidence Passport & Plain-Language Glossary (M7)
- Structured **Evidence Passport** on every recommendation rendered deterministically from templates (no free-form hallucinated claims):
  - Evidence tier (*Established science*, *Data-derived finding*, *Farmer-reported observation*, *Unverified hypothesis*, *Expert-validated insight*)
  - Datasets, spatial/temporal coverage, product versions, and analytical method applied
  - Uncertainty bounds, missing inputs, and dataset limitations
  - **Required local review checklist** naming what the farmer, extension officer, or agronomist must verify locally (seed availability, disease pressure, market access, soil test)
- Built-in **plain-language glossary** explaining technical terms (`NDVI`, `Evapotranspiration`, `Soil moisture anomaly`, `Dry spell`, `Rainfall reliability`, `Bare-field period`, `Nitrogen-fixing crop`, and `Satellite vs. ground data`).

### 7. Low-Bandwidth Access, Localization & Officer Workflow
- **English and Twi** localization (`next-intl`).
- **Low-bandwidth & offline PWA support:** Printable/shareable one-page summary cards, cached last result card, and queued farmer outcome reports when offline.
- **Role-protected extension officer routes** (via Supabase Auth + Row-Level Security) for logging farmer decisions, grading field outcomes, and reviewing unverified hypotheses.
- **SMS / USSD web mock** for demonstrating low-connectivity farmer delivery during the hackathon.

---

## Local Development & Verification

Run commands from the repository root with `--prefix apps/web` or inside `apps/web/`:

```bash
# Install dependencies
npm --prefix apps/web install

# Run development server (http://localhost:3000)
npm --prefix apps/web run dev

# Run TypeScript scoring parity tests against shared/test-vectors/scoring_basic.json
npm --prefix apps/web test

# Typecheck, lint, and production build
(cd apps/web && npx tsc --noEmit)
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

## Deployment

Configured for Vercel as a standalone Next.js project with **Root Directory** set to `apps/web` (see `../../PROJECT_LAYOUT.md`). Keep runtime imports self-contained inside `apps/web/` so production Turbopack builds on Vercel do not depend on parent-directory files (test files such as `src/lib/scoring.test.ts` may read `../../shared/test-vectors/` during CI/local testing).
