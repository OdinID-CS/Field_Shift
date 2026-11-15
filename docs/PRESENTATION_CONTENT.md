# Field Shift — Presentation Content & Challenge Alignment Guide

> **How to use this guide:** Every section gives you two versions of what to say:
> 1. **Professional / Judge View:** Exact NASA datasets, models (`M1–M9`), architecture, and challenge requirements met.
> 2. **Explain Like I'm 5 (ELI5):** Simple, human analogies you can speak directly on stage or in a demo video.

---

## Slide 1 — The Problem & Why Ashanti, Ghana

### Professional / Judge View
- Smallholder farmers in **Ashanti Region, Ghana** navigate bimodal rainfall (`Major` Mar–Jul, `Minor` Sep–Nov), shifting rainy-season onset, Harmattan dry-season bare-soil exposure (`Dec–Feb`), heavy wet-season cloud gaps, and sloping soils prone to erosion.
- Most challenge example datasets (CDL, SSURGO, PRISM, OpenET) are **US-only**. Field Shift deliberately uses **global NASA & partner Earth observations** so the pipeline transfers beyond Ghana while staying grounded in **MoFA** and **CSIR-CRI** agronomic data.

### Explain Like I'm 5
Imagine your garden has two rainy times and one super dusty, dry time. If you plant the same hungry plant (maize) in the exact same spot every time, the dirt gets tired, thirsty, and washes away when big storms come. Satellites in space can see the rain and the plants, but they speak "space math"—not farmer language. **Field Shift is the translator.**

---

## Slide 2 — What Field Shift Does (In One Breath)

### Professional / Judge View
Field Shift turns multi-year (`2022–2025`) NASA satellite time series and local soil/crop knowledge into:
1. A **36-Dekad Vulnerability & Bare-Field Calendar** showing when fields are exposed or stressed.
2. A **Priority-Weighted Strategy Comparison** across **5 Ashanti rotation options** (including the farmer's `Baseline: Continuous Maize` plus 4 alternatives) with **Monte Carlo rank stability** and **Minimax Climate Regret**.
3. An **Evidence Passport** & **Scale-Honesty Audit** for every recommendation, paired with **offline-first mobile (`Expo`)**, **web (`Next.js`)**, **EN + Ashanti Twi SMS/USSD/WhatsApp**, and **officer-gated Bayesian learning (`M8`)**.

### Explain Like I'm 5
Field Shift is a smart helper for farmers. First, it shows a **weather & bare-dirt calendar** so you know when the ground is naked and needs a blanket. Next, it compares **5 different ways to take turns planting crops** based on what *you* care about most (saving water, keeping soil healthy, or earning money). And it always shows a **receipt ("Evidence Passport")** explaining *why* it made that guess and what a human expert still needs to double-check.

---

## Slide 3 — Understanding Conditions & Harmonizing Data

### Professional / Judge View
- **Global Datasets Harmonized onto a `0.05°` Ashanti Grid & 36-Dekad (10-day) Calendar:**
  - **Rainfall & Drought:** GPM IMERG + NASA POWER + ERA5 cross-check.
  - **Soil Moisture & Evaporation:** SMAP (surface & root-zone `9 km`), WaPOR-style Water Satisfaction Index (`P / ET0`), and cumulative evaporative deficit (`max(ET0 - P)`).
  - **Vegetation & Canopy:** MODIS/HLS NDVI (`250 m` / `30 m`, cloud-masked at `cloud_prob <= 0.45`) and GEDI canopy structure (`25 m`).
  - **Terrain & Soil:** Copernicus/SRTM DEM slope (`90 m` / `30 m`) + iSDAsoil v2 (`30 m`) / SoilGrids (`250 m`) pH and texture.
- **Plain-Language Science Explainers Built Into UI:** Tooltips and a Glossary explain *evapotranspiration (`ET0`)*, *soil moisture anomalies*, *NDVI*, *flash-drought decoupling*, and *why satellite pixels differ from a 2-hectare plot*.

### Explain Like I'm 5
Different space cameras take pictures at different sizes—some see a whole town (`9 km` SMAP box), while others see a single soccer field (`30 m` HLS). We line all those pictures up onto **one shared map grid** and **36 ten-day buckets** for the year, just like putting puzzle pieces from different boxes onto the same table.

---

## Slide 4 — Statistical & Machine Learning Models (`M1–M9`)

### Professional / Judge View
| Model | Method | What It Answers |
| :--- | :--- | :--- |
| **M1 — Seasonal Anomaly** | Z-score maxima + `IsolationForest` (`n_estimators=150`) | How extreme was a season's rain, dry spell, heat, soil moisture, or bare exposure? |
| **M2 — Regime Clustering & Analogs** | `KMeans` (`3` regimes: `dry_stressed`, `moderate_variable`, `wet_vigorous`) + Euclidean analog lookup | Which past year (`driest`, `wettest`, `hottest`, `typical`) does a stress scenario match? |
| **M3 — NDVI Phenology & Bare Soil** | Cloud-masked smoothed 36-dekad NDVI curve | When do `Major` / `Minor` green-ups happen, and which dekads drop below `ndvi_smooth < 0.28` (bare)? |
| **M4 — Climate Trend** | Mann-Kendall test + Sen's slope (`mm/yr`) | Is seasonal rainfall trending drier or wetter over time (with `p_value` honesty)? |
| **M6 — MCDA + Monte Carlo + Minimax Regret** | Transparent weighted sum + `2,000`-run uncertainty perturbation + worst-case regret | Which rotation wins under the farmer's weights, and which loses least in bad weather? |
| **M7 — Evidence Passports** | Deterministic UUIDv5 provenance + Scale Honesty (`pixel/farm` ratio) | What data backed this score, what is missing, and is the satellite pixel too big for this farm? |
| **M8 — Conjugate Bayesian Calibration** | Closed-form Normal-conjugate updates (`officer_reviewed` / `expert_validated` only) | How do real field outcomes safely improve strategy priors without noisy unverified labels? |
| **M9 — On-Device Plot Vision** | Offline Skia `64×64` RGBA spectral indices (`ExG`, `NGRDI`, residue ratio) | From a phone photo in the field, is the ground `Intact`, `Partial`, or `Bare`? |

### How `M1–M9` Are Exported & Deployed (No Heavy `.pkl` / `.onnx` Model Hosting)
- **Offline Batch -> JSON Bundle & Supabase (`M1`, `M2`, `M3`, `M4`, `M7`, `M8`):** Heavy geospatial/ML models (`scikit-learn`, `pymannkendall`) run offline in Python (`pipeline/src/fieldshift/`). `publish.py` exports precomputed cell features, 36-dekad trajectories, analog seasons, and Evidence Passports into `pipeline/data/ashanti_pilot_bundle.json` and upserts them into **Supabase (PostgreSQL + PostGIS)**. The apps never need a heavyweight Python ML server.
- **Cross-Language Math Parity (`M6`):** Weighted-sum MCDA, Monte Carlo rank stability, climate stress perturbations, and Minimax Regret are deterministic math over `knowledge/*.csv` priors—implemented directly in Python (`pipeline/`, `apps/api/scoring.py`) and TypeScript (`apps/web/src/lib/scoring.ts`, `apps/mobile/src/lib/scoring.ts` & `stress.ts`), verified to `1e-9` parity via `shared/test-vectors/`.
- **On-Device Edge Vision (`M9`):** Bundled inside the mobile app (`apps/mobile/src/lib/vision-classifier.ts`) using **React Native Skia** (`skia-agronomic-v1`) so plot photos run 100% offline with a pluggable `VisionBackendId` interface ready for quantized `.onnx`/`.tflite` weights later.

### Validation, Stability & Uncertainty Metrics (Honest Judge Assessment)
Measured by `pipeline/src/fieldshift/models/validation.py` across the 5 Ashanti pilot cells × 4 years (`2022–2025`):
- **M2 Bootstrap Cluster Stability (`n_bootstrap = 25`):** `mean_stability = 0.9579` (`95.8%`) — **strong** regime stability under resampling.
- **Leave-One-Year-Out Temporal Check (`years_tested = 4`):** `mean_anomaly_score_shift = 0.1463`, `cluster_label_agreement = 0.7222` (`72.2%`) — **solid for a 4-year baseline**, while honestly showing why short baselines need M4 `p_value` checks and local expert review.
- **Cross-Source Rainfall Agreement (`n_pairs = 720`):** `pearson_r = 0.9919`, `mae_mm = 3.7`, `bias_pct = 0.98%` — **caveat:** on the synthetic pilot generator (`generate_ashanti_pilot_raw_daily`), IMERG and ERA5 share a base signal, so this verifies the harmonization pipeline rather than real-world Ghana satellite agreement.
- **M6 Parity & Robustness:** `1e-9` base-score & `2e-4` stress-test parity across Python, Web, and Mobile + `2,000`-run Monte Carlo rank stability & Minimax Regret.
- **Honest Boundary:** We deliberately do **not** claim supervised crop-yield accuracy (RMSE/F1) without verified Ashanti harvest labels; **M7** (Evidence Passports) and **M8** (officer-gated calibration) collect ground truth safely over time.

### Explain Like I'm 5
We don't use one giant mystery robot brain, and we don't need a giant expensive computer running in the cloud to answer every tap:
- **Helper 1–4, 7 & 8** do their heavy homework ahead of time and save the answers into a neat **notebook** (JSON + Supabase) that the app reads instantly.
- **Helper 6 (The Scoreboard)** is pure, fast math built right into the app—so moving your priority sliders works in **0 milliseconds**, even offline.
- **Helper 9 (The Phone-Camera Helper)** lives right inside the phone app using lightweight Skia pixel math—so your phone camera can check the dirt in **Airplane Mode**!

---

## Slide 5 — Rotation Strategy Exploration (5 Ashanti Strategies)

### Professional / Judge View
We compare **5 strategies** (exceeding the minimum 3, including the farmer's baseline) from `knowledge/rotations_ashanti.csv`:
1. **`Baseline: Continuous Maize`** (`Major Maize → Minor Maize`) — Familiar inputs, but depletes soil N, carries over fall armyworm, and suffers during Harmattan bare-soil exposure.
2. **`Strategy A: Maize-Cowpea Relay`** (`Major Maize → Minor Early Cowpea`) — Fixes `~45 kg N/ha` (`~2.0` urea bags saved/ha), breaks cereal pest cycles, fits the shorter `Sep–Nov` minor rains.
3. **`Strategy B: Soil-Cover & Mucuna Mulch`** (`Major Maize + Mucuna Relay / Mulch`) — Protects sloping sandy clay loam through Harmattan bare dekads (`Dec–Feb`), reducing erosion.
4. **`Strategy C: Water-Resilient Maize-Groundnut`** (`Early Drought-Tolerant Maize → Minor Groundnut`) — `Omankwa/Abontem` buffers March onset uncertainty; groundnut adds N credit and market income.
5. **`Strategy D: Maize-Soybean Rotation`** (`Early Maize → Minor Soybean`) — High biological N-fixation (`~75 kg N/ha`) + Striga trap-crop benefit + poultry-feed market demand.

Each strategy displays **expected benefits**, **information gaps**, **risks needing local review**, **urea bags saved**, and **Harmattan bare days avoided**.

### Explain Like I'm 5
Instead of planting only maize forever (which gets boring for the soil and invites bugs), Field Shift compares **4 smarter crop team-ups**:
- **Cowpea & Groundnut & Soybean** are "fertilizer-maker plants"—they grab plant food straight from the air and put it back in the dirt so farmers buy less fertilizer!
- **Mucuna** acts like a thick leaf blanket so the hot Harmattan wind doesn't blow the soil away.

---

## Slide 6 — Geospatial Mapping, Climate Stress-Testing & Scale Honesty

### Professional / Judge View
- **Interactive Maps (`MapLibre` on Web, `react-native-maps` on Mobile):** Explore the 5 Ashanti pilot cells (`ASH_R05_C05` and neighbors) with soil moisture, bare-soil risk, and terrain layers.
- **Climate Stress-Testing:** Interactive scenario presets (`Baseline`, `Dry -20%`, `Heat +2°C`, `Squall +20%`) plus rainfall/temperature sliders (Web) and analog replay, backed by `POST /api/stress-test` and local TypeScript parity (`shared/test-vectors/stress_test_basic.json`).
- **Scale Honesty Check (`/scale-honesty`):** Explicitly compares a farmer's parcel size (`0.5 ha`–`25 ha`) against each sensor's footprint (`25 m` GEDI, `30 m` HLS/iSDAsoil, `90 m` DEM, `250 m` MODIS/SoilGrids, `9 km` SMAP ≈ `1,620` farms/pixel) so coarse data is never misrepresented as plot-level ground truth.

### Explain Like I'm 5
If you look at a neighborhood from an airplane, one giant square (`9 km` SMAP) covers over `1,600` farms! Our **Scale Honesty Check** draws boxes inside boxes to remind everyone: *"This space camera sees your whole neighborhood, while this sharper camera sees your own yard—so ask a local expert before making big decisions."*

---

## Slide 7 — Farmer-Centered Design, Offline-First & Role Access

### Professional / Judge View
- **Adjustable Farmer Priorities:** Sliders & presets (`Balanced`, `Water-First`, `Soil`, `Income`) immediately recompute M6 rankings locally with 0 ms latency.
- **Offline-First Architecture:**
  - **Mobile (`Expo SDK 58`):** Pre-caches multi-cell **Ashanti District Packs** in `AsyncStorage`, queues `decision_logs` & `outcome_reports` offline with a detached Sync button badge, and runs **M6** + **M9** (camera plot cover scan) completely offline.
  - **Low-Bandwidth Channels:** `<320`-char bilingual **English + Ashanti Twi** SMS/WhatsApp summary cards and live **Africa's Talking USSD (`*...#`)** menu flows.
- **Phone + 4-Digit PIN Role Access (Challenge Demo):**
  - **Farmer (`0512345601` / `1111`):** Explore strategies, scan plots, log decisions & unverified field observations.
  - **Extension Officer (`0512345602` / `2222`):** Review and grade field outcomes (`officer_reviewed` / `confounded_excluded`) via `/officer`.
  - **Agronomist (`0512345603` / `3333`):** Validate `expert_validated` outcomes and oversee M8 Bayesian calibration.

### Explain Like I'm 5
Out on the farm, internet bars disappear. So Field Shift packs its whole notebook onto your phone **before** you leave town, lets you sign in with just a **phone number and 4-digit PIN**, works even in **Airplane Mode**, and can even text advice in **English or Twi**!

---

## Slide 8 — Challenge Requirements & Objectives Traceability Matrix

| Challenge Objective / Consideration | How Field Shift Addresses It | Where in Repo |
| :--- | :--- | :--- |
| **Use global NASA & partner EO data** (SMAP, GPM, MODIS, POWER, SRTM, GEDI + SoilGrids/iSDAsoil) | Harmonized onto `0.05°` Ashanti grid & 36 dekads; zero US-only baselines (`NON_GLOBAL_US_BASELINES` enforced) | `pipeline/src/fieldshift/ingest/`, `evidence/m7_passport.py` |
| **Analyze temp, heat, rain, soil moisture, ET, vegetation stress, trends** | M1 anomaly, M2 clustering, M3 NDVI phenology, M4 Mann-Kendall, WaPOR `P/ET0`, flash-drought decoupling | `pipeline/src/fieldshift/models/`, `features/seasonal.py` |
| **Highlight bare-field times & vulnerable seasons** | 36-Dekad Exposure Calendar (`ndvi_smooth < 0.28`), Harmattan bare-days counter, Major/Minor onset cards | `apps/mobile/src/components/dekad-heatmap-matrix.tsx`, `apps/web/src/components/` |
| **Compare ≥3 strategies including existing rotation** | Compares `Baseline: Continuous Maize` + 4 cited Ashanti legume/cover rotations (`A–D`) | `knowledge/rotations_ashanti.csv`, `compare.tsx`, `StrategyComparisonStudio.tsx` |
| **Explain why suggested, evidence, benefits, gaps & local risks** | Every strategy links to an **Evidence Passport** (`evidence_passports`) + MoFA/CSIR-CRI checks | `apps/mobile/src/app/(tabs)/passport.tsx`, `apps/web/src/components/EvidencePassportDialog.tsx` |
| **Farmer priorities, constraints & plain-language UX** | Interactive priority weights, scale-honesty parcel audit, EN + Twi `<320`-char SMS/USSD, plain glossary | `apps/mobile/src/app/scale-honesty.tsx`, `apps/web/src/app/sms-ussd/page.tsx` |
| **Support—not replace—human expertise** | Officer-gated **M8** Bayesian calibration (ignores unverified farmer logs until `officer_reviewed`/`expert_validated`) + Supabase RLS | `pipeline/src/fieldshift/models/feedback.py`, `apps/web/src/app/officer/page.tsx` |
| **Cross-platform engineering rigor** | `1e-9` base-score & `2e-4` stress-test parity vectors enforced across Python, Web, and Mobile in CI | `shared/test-vectors/`, `.github/workflows/ci.yml` |
