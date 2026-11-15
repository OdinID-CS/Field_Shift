# Field Shift: Build Phases & Work Assignment

**Team & Environments:**
- **`kaliblip` (macOS):** Mobile app (`apps/mobile/`), offline ML & Earth observation pipeline (`pipeline/`), crop knowledge base (`knowledge/`), FastAPI decision service (`apps/api/`), and Supabase pipeline migrations/uploads (`supabase/`).
- **`OdinID-CS` (Linux):** Web application (`apps/web/`), interactive map & calendar visualizations, strategy comparison & scenario sliders UI, Evidence Passport & glossary UI, localization, PWA offline support, and Vercel web deployment.

---

## Current Progress Snapshot

| Phase | `kaliblip` (Mobile, Pipeline, API, DB) | `OdinID-CS` (Web App) | Notes |
| --- | --- | --- | --- |
| Phase 0 — Foundations & Scoring Parity | ✅ Completed | ✅ Completed | Python, Web, Mobile match `shared/test-vectors/scoring_basic.json` to `1e-9`. |
| Phase 1 — Schema, Ingestion & Context | ✅ Completed | ✅ Completed | Live Supabase schema migrated & seeded with 30 m **iSDAsoil v2**, 30 m **NASA HLS** (`L30`/`S30`), 90 m **Copernicus DEM**, 1 km **MODIS LST**, **ERA5-Land**, and **NASA POWER**. |
| Phase 2 — Features, M1–M4 & Core Visuals | ✅ Completed | ✅ Completed | Pipeline features (WaPOR `P/ET0`, water deficit, flash-drought decoupling), M1–M4 models, cited `knowledge/*.csv`, and Web Calendar/Map/Scale-Honesty Banner completed. |
| Phase 3 — M6/M7, Supabase Seed & Comparison UI | ✅ Completed | ✅ Completed | M6 fusion (N-fixation urea bag savings & Harmattan bare-days avoided), M7 Passports, live `5`-cell Supabase seed, and Web/Mobile comparison & Evidence Passport UI completed. |
| Phase 4 — Stress-Testing, Analogs & Offline Cache | ✅ Completed *(M5 stretch deferred)* | ✅ Completed | Pipeline stress curves + **Minimax Climate Regret**, FastAPI `/api/stress-test` & `/api/analogs`, Web & Mobile offline cell cache + `decision_logs`/`outcome_reports` queue, print view, and PWA Service Worker completed. |
| Phase 5 — Validation, Model Cards & Demo Polish | ✅ Completed | ✅ Completed | LOYO CV, IMERG vs. ERA5 check, bootstrap stability, `docs/MODEL_CARDS.md` (`M1–M8`), EN + Twi localization (`next-intl`), officer portal (`/officer`), SMS/USSD simulator (`/sms-ussd`), multi-service Vercel deploy (`https://scalarfield.vercel.app`), & `26` pytest + `10` web + `3` mobile tests passing. |
| Phase 6 — Scientific Advancements & Scale-Out | ✅ Completed | ✅ Completed | Normal-conjugate **M8** Bayesian outcome calibration (`models/feedback.py`, `m8-calibration.ts`) + live **Africa's Talking** USSD/SMS & WhatsApp Business API routes (`/api/ussd`, `/api/whatsapp/webhook`, `/api/messaging/dispatch`, `/api/officer/review`) + mobile `roofi` design system & dedicated Scale Honesty screen completed. |

---

## 1. Repository Ownership Matrix

| Area | Directory / Files | Primary Owner | Collaborator / Reviewer | Notes |
| --- | --- | --- | --- | --- |
| Offline ML & EO Pipeline | `pipeline/` (`ingest`, `qc`, `features`, `models`, `decision`, `evidence`) | `kaliblip` | `OdinID-CS` | Computes features, calendars, clusters, anomalies, and Evidence Passports; writes outputs to Supabase. |
| Crop Knowledge Base | `knowledge/` | `kaliblip` | `OdinID-CS` | Sourced CSV crop & rotation tables; every entry carries a citation and expert-review status. |
| Mobile App (Expo SDK 58) | `apps/mobile/` | `kaliblip` | `OdinID-CS` | Farmer & extension-officer React Native experience with shared TS scoring logic. |
| Optional FastAPI Service | `apps/api/` | `kaliblip` | `OdinID-CS` | Python scoring & stress-testing API; Vercel Python 3.12 runtime. |
| Web App (Next.js) | `apps/web/` | `OdinID-CS` | `kaliblip` | Primary web PWA for judges, farmers, and extension officers (Vercel project `apps/web`). |
| Database & PostGIS Schema | `supabase/migrations/` | `kaliblip` (schema/ingest) | `OdinID-CS` (web queries & RLS) | Schema applied & seeded; RLS separates farmer vs. officer roles. |
| Shared Parity Fixtures | `shared/test-vectors/` | Joint (`kaliblip` + `OdinID-CS`) | Both | Python (`apps/api`) and TypeScript (`apps/web`, `apps/mobile`) scoring must match to `1e-9`. |

---

## 2. Build Phases (Parallel Workstreams)

### Phase 0 — Repository Foundations, App Scaffolds & Scoring Parity ✅ Completed

- **Shared (`kaliblip` + `OdinID-CS`):**
  - [x] Flattened monorepo layout (`apps/web`, `apps/mobile`, `apps/api`, `pipeline`, `knowledge`, `supabase`, `shared`).
  - [x] Verified deterministic `1e-9` scoring parity across Python (`apps/api/scoring.py`), Web (`apps/web/src/lib/scoring.ts`), and Mobile (`apps/mobile/src/lib/scoring.ts`) against `shared/test-vectors/scoring_basic.json`.
  - [x] Documented web feature specification (`apps/web/README.md`) and macOS/Linux Python 3.12 `.venv` onboarding (`PROJECT_LAYOUT.md`).

---

### Phase 1 — Data Contracts, Supabase Schema & Pilot Ingestion (`Must Have`) ✅ Completed

**Integration gate:** Supabase table schemas (`pilot_cells`, `dekad_timeseries`, `season_features`, `strategy_scores`, `evidence_passports`, `decision_logs`, `outcome_reports`) created in `supabase/migrations/20261114000000_phase1_schema.sql` and applied to Supabase.

| Owner | Status | Tasks | Deliverables |
| --- | --- | --- | --- |
| **`kaliblip`** | ✅ Done | - [x] Confirm pilot area coordinates & bounding box in `pipeline/config/pilot.yaml` (50 × 50 km around Ashanti partner farm).<br>- [x] Build `pipeline/src/fieldshift/ingest/` (`earthaccess` for IMERG/SMAP/HLS/GEDI/MODIS/SRTM, POWER REST API, SoilGrids, `NON_GLOBAL_US_BASELINES` notes) with provenance manifest.<br>- [x] Build `pipeline/src/fieldshift/qc/` (cloud masking, NDVI smoothing, dekad harmonisation cube).<br>- [x] Design `supabase/migrations/` PostGIS tables & RLS policies.<br>- [x] Set up `apps/mobile` 4-tab telemetry navigation shell (Home, Calendar, Compare, Passport). | Raw archive + provenance manifest; clean dekad analysis cube; SQL migration (applied); mobile nav shell. |
| **`OdinID-CS`** | ✅ Done | - [x] Configure Supabase client & TypeScript database types in `apps/web/src/lib/supabase.ts` and `apps/web/src/types/database.ts`.<br>- [x] Build **Farm Context & Priority Input** UI in `apps/web/src/components/FarmContextPriorityInput.tsx` and landing page `apps/web/src/app/page.tsx`.<br>- [x] Wire `apps/web/src/lib/scoring.ts` to live priority slider state. | Interactive priority-input state + Supabase setup in `apps/web` *(note: align column names in `database.ts` with seeded `20261114000000_phase1_schema.sql` tables before Phase 3 web queries)*. |

---

### Phase 2 — Environmental Intelligence, Knowledge Table & Core Visuals (`Must Have`)

| Owner | Status | Tasks | Deliverables |
| --- | --- | --- | --- |
| **`kaliblip`** | ✅ Done | - [x] Build `pipeline/src/fieldshift/features/seasonal.py` (rainfall onset/cessation, total/CV, longest dry spell, heavy-rain days, heat-stress days, FAO-56 Hargreaves ET0, bare-period fraction, slope, erosion exposure).<br>- [x] Implement **M1** (`anomaly.py`), **M2** (`clustering.py`), **M3** (`phenology.py`), and **M4** (`trends.py`) in `pipeline/src/fieldshift/models/`.<br>- [x] Populate cited Ashanti crop & rotation parameter CSVs in `knowledge/crops_ashanti.csv` and `knowledge/rotations_ashanti.csv`. | Feature tables, M1–M4 outputs, and cited `knowledge/*.csv` tables (`test_phase2_features_models.py` passing). |
| **`OdinID-CS`** | ✅ Done | - [x] Build the **Seasonal Vulnerability & Bare-Field Calendar** component in `apps/web` using Recharts (`src/components/VulnerabilityCalendar.tsx`).<br>- [x] Build the **Interactive Map Explorer** using MapLibre GL (`maplibre-gl` in `src/components/AshantiMapExplorer.tsx`) with layer toggles, time scrubbing, and vector fallback.<br>- [x] Implement the **Scale-Honesty Banner** (`src/components/ScaleHonestyBanner.tsx`) comparing each dataset's native resolution against the user's farm area. | Vulnerability Calendar, MapLibre map explorer, and Scale-Honesty UI in `apps/web`. |

---

### Phase 3 — Decision Layer, Evidence Passports & Strategy Comparison (`Must Have`)

| Owner | Status | Tasks | Deliverables |
| --- | --- | --- | --- |
| **`kaliblip`** | ✅ Done | - [x] Implement **M6** (`pipeline/src/fieldshift/decision/m6_fusion.py`) combining `knowledge/*.csv` criteria with cell features.<br>- [x] Implement **M7** (`pipeline/src/fieldshift/evidence/m7_passport.py`) deterministic Evidence Passport generator.<br>- [x] Publish precomputed pilot tables (`5` core cells, `720` dekad rows, `60` season features, `25` Evidence Passports, `25` strategy scores) into Supabase via `publish.py` with live `smap`, `smap_root_zone`, `modis_ndvi`, `nasa_power`, and `soilgrids` provenance.<br>- [x] Implement `apps/mobile` screens + PostgREST hydration (`src/lib/supabase.ts`, `src/hooks/use-pilot-state.tsx`). | Seeded Supabase pilot dataset + working `apps/mobile` core flow (`test_phase3_decision_evidence.py` passing). |
| **`OdinID-CS`** | ✅ Done | - [x] Connect `apps/web` to Supabase precomputed tables (`pilot_cells`, `dekad_timeseries`, `season_features`, `strategy_scores`, `evidence_passports`, plus offline fixture fallback in `src/lib/supabase.ts`).<br>- [x] Build **Rotation Strategy Comparison Cards & Table** (`src/components/StrategyComparisonStudio.tsx`) displaying weighted scores, **Monte Carlo rank probabilities**, benefits, gaps, and risks.<br>- [x] Build the **Evidence Passport** modal (`src/components/EvidencePassportDialog.tsx`) and **Plain-Language Glossary** tooltips (`src/components/GlossaryPopoverBar.tsx`). | End-to-end core decision UI in `apps/web`. |

---

### Phase 4 — Climate Stress-Testing, Analog Replay & Offline Support (`Should Have`)

| Owner | Status | Tasks | Deliverables |
| --- | --- | --- | --- |
| **`kaliblip`** | ✅ Done *(Stretch deferred)* | - [x] Export historical analog season presets (`driest`, `wettest`, `hottest`, `typical`) and climate perturbation curves (`pipeline/src/fieldshift/decision/stress_test.py`).<br>- [x] Expose `POST /api/stress-test` and `GET /api/analogs` in `apps/api/index.py`.<br>- [ ] *(Stretch, deferred)* Evaluate **M5** (AquaCrop-OSPy + quantile LightGBM surrogate) if serverless bundle size permits.<br>- [x] Add per-cell local offline cache (`src/lib/supabase.ts`, `src/hooks/use-pilot-state.tsx`) and Climate Stress-Test pills (`src/lib/stress.ts`, `src/app/compare.tsx`) on `apps/mobile`. | Analog season presets, climate stress endpoints, mobile stress UI & offline cell cache. |
| **`OdinID-CS`** | ✅ Done | - [x] Build **Climate Stress-Testing** controls in `apps/web` (rainfall/temperature sliders, analog season replay, and minimax regret in `src/lib/stress.ts` & `StrategyComparisonStudio.tsx`).<br>- [x] Add printable one-page summary cards (`@media print`) and PWA manifest/service-worker caching (`src/app/manifest.ts`, `public/sw.js`) + offline queued decision/outcome reports (`src/lib/supabase.ts`). | Interactive scenario sliders, analog replay, print view, and PWA caching in `apps/web`. |

---

### Phase 5 — Validation, Localization, Officer Workflow & Demo Polish (`Should Have` / `Demo`)

| Owner | Status | Tasks | Deliverables |
| --- | --- | --- | --- |
| **`kaliblip`** | ✅ Done | - [x] Run leave-one-year-out temporal CV, IMERG vs. ERA5 rainfall cross-checks, and M2 bootstrap cluster stability (`pipeline/src/fieldshift/models/validation.py`).<br>- [x] Add A1–A4 platform adoptions (`iSDAsoil` 30 m adapter, WaPOR `P/ET0` & deficit, EN + Twi SMS/WhatsApp summary export in `apps/mobile/src/lib/sms-export.ts`, and offline-queued `decision_logs`/`outcome_reports` sync in `apps/mobile/src/lib/supabase.ts`).<br>- [x] Add B1–B4 scientific advancements (Minimax Climate Regret in `stress_test.py`/FastAPI/`stress.ts`, M8 Normal-conjugate calibration in `models/feedback.py`, flash-drought decoupling detector in `seasonal.py`, and urea-bag N-fixation savings & bare-days avoided in `m6_fusion.py`).<br>- [x] Generate per-module model cards (`M1–M8`) in `docs/MODEL_CARDS.md` and pass `test_phase6_adoptions_advancements.py`.<br>- [x] Adopt Autis Planner (`roofi`) mobile design system, `sileo-native` toasts, dedicated Scale Honesty screen, and live Vercel FastAPI integration (`https://scalarfield.vercel.app`). | Validation & Phase 6 suite (`26` pytest + `3` mobile tests), `docs/MODEL_CARDS.md`, and complete mobile experience. |
| **`OdinID-CS`** | ✅ Done | - [x] Add English & Twi translation support (`next-intl` in `src/i18n/messages/{en,tw}.json`, `I18nProvider.tsx`, `AppNav.tsx`).<br>- [x] Build role-protected Extension Officer routes (`src/app/officer/page.tsx`: decision logging + field outcome grading) and the **SMS / USSD web mock** (`src/app/sms-ussd/page.tsx`) for the demo.<br>- [x] Deploy multi-service `web` + `api` project to Vercel (`https://scalarfield.vercel.app` via root `vercel.json` with `DECISION_API_URL` service binding). | Live multi-service Vercel deployment at `https://scalarfield.vercel.app` with Twi toggle, officer workflow, and SMS/USSD gateway. |

---

### Phase 6 — Scientific Advancements & Post-Hackathon Scale-Out 🟡 Core M8 Done

- [x] **`kaliblip`:** Implement lightweight conjugate Bayesian outcome calibration (**M8**, `pipeline/src/fieldshift/models/feedback.py`, governance-gated strictly to `officer_reviewed`/`expert_validated` grades) and mobile field outcome reporting (`apps/mobile/src/app/(tabs)/passport.tsx`).
- [x] **`kaliblip`:** Add multi-cell offline district pack prefetch (`prefetchDistrictPack`), on-device Skia plot vision classifier (**M9**, `apps/mobile/src/lib/vision-classifier.ts`), phone + 4-digit PIN auth screens (`apps/mobile/src/app/login.tsx`, `apps/web/src/app/login/page.tsx`), `stress_test_basic.json` parity vector, and GitHub Actions CI (`.github/workflows/ci.yml`).
- [ ] **`kaliblip`:** Expand `pipeline/config/` to additional Ghanaian/West African regions and build native EAS mobile distribution.
- [x] **`OdinID-CS`:** Integrate live **Africa's Talking** SMS/USSD and WhatsApp Business APIs alongside officer-review dashboard routes (`apps/web/src/app/api/ussd/route.ts`, `apps/web/src/app/api/whatsapp/webhook/route.ts`, `apps/web/src/app/api/messaging/dispatch/route.ts`, `apps/web/src/app/api/officer/review/route.ts`, `apps/web/src/lib/comms.ts`, `apps/web/src/lib/m8-calibration.ts`, wired into `/sms-ussd` and `/officer` with sandbox/simulated fallback).

---

## 3. Collaboration & Git Workflow

1. **Conflict-free directory boundaries:** `kaliblip` works primarily in `pipeline/`, `knowledge/`, `apps/mobile/`, `apps/api/`, and `supabase/migrations/`; `OdinID-CS` works primarily in `apps/web/`. Changes to `shared/` or Supabase table schemas should be reviewed by both developers.
2. **Branching & PRs:**
   - `kaliblip` works on branch `kaliblip` → PR into `main`.
   - `OdinID-CS` works on branch `OdinID` (or feature branches from `main`) → PR into `main`.
   - Pull `main` before starting each new phase to stay synced on Supabase schema migrations and shared test vectors.
3. **Cross-platform parity check before merging scoring changes (automated in `.github/workflows/ci.yml`):**
   - Pipeline: `PYTHONPATH=pipeline/src:apps/api .venv/bin/pytest pipeline/tests`
   - API: `.venv/bin/pytest -v apps/api/tests/test_scoring.py`
   - Web: `(cd apps/web && npx next typegen && npx tsc --noEmit && npm test)`
   - Mobile: `./apps/mobile/node_modules/.bin/tsc -p apps/mobile/tsconfig.json --noEmit && npm --prefix apps/mobile test`
