# Field Shift — "Explain Like I'm 5" Presentation Script (+ Judge Reference)

> A stage-ready, plain-language presentation script designed so anyone can understand Field Shift in minutes—paired with the **Judge / Technical Reference** for what Field Shift does, our **M1–M9** models, and our **Challenge Traceability Matrix**.

---

## Slide 1 — Why Are We Here? (The Problem)

Imagine your backyard garden has two rainy times and one super dusty, windy dry time (that's Ashanti, Ghana!).

If you plant the exact same hungry plant—**maize**—in the exact same dirt over and over:
- The dirt gets tired and loses its plant food.
- Bugs that love maize stick around and throw a party.
- When the dusty wind blows (`Dec–Feb`), the naked dirt dries out and washes away when the big rain returns.

NASA satellites in space can see the rain, the wet dirt, and the plants—**but satellites speak "space math," not farmer language.** **Field Shift is the translator.**

---

## Slide 2 — What Field Shift Does (In One Breath)

### Explain Like I'm 5
Field Shift is a smart garden helper on your phone or computer:
1. It shows a **36-bucket weather & naked-dirt calendar** so you know which weeks the ground needs a leaf blanket.
2. It compares **5 different crop team-ups** based on *your* rules (saving water, healing dirt, or earning money).
3. Every single guess comes with a **receipt ("Evidence Passport")** showing *why* it guessed that, what it *doesn't* know, and what a human farm expert should check first.

### Professional / Judge View
Field Shift turns multi-year (`2022–2025`) global NASA & partner Earth observations and local MoFA/CSIR-CRI soil/crop knowledge into:
1. A **36-Dekad Vulnerability & Bare-Field Calendar** highlighting seasonal onset, drought/flood windows, and bare-soil exposure.
2. A **Priority-Weighted Strategy Comparison** across **5 Ashanti rotation options** (`Baseline: Continuous Maize` + Strategies `A–D`) with **2,000-run Monte Carlo rank stability** and **Minimax Climate Regret**.
3. An **Evidence Passport** & **Scale-Honesty Audit** for every recommendation, delivered via **offline-first mobile (`Expo`)**, **web (`Next.js`)**, **EN + Ashanti Twi SMS/USSD/WhatsApp**, and **officer-gated Bayesian learning (`M8`)**.

---

## Slide 3 — Lining Up the Space Pictures (Data & Scale Honesty)

Some space cameras take huge wide pictures (`9 km` SMAP—big enough to cover **1,620 farms** in one square!). Other cameras take sharp close-up pictures (`30 m` HLS / iSDAsoil—like looking at one yard).

- First, we line up all those different-sized puzzle pieces onto **one shared map grid** and **36 ten-day buckets**.
- Second, our **Scale Honesty Check** draws boxes inside boxes so we *never* pretend a neighborhood-sized space picture knows every inch of a tiny 2-hectare farm.

---

## Slide 4 — Our 9 Smart Helpers (`M1–M9`)

### Explain Like I'm 5
Instead of one giant mystery robot brain, Field Shift uses **9 small, honest helpers**:
- **Helper 1 (Weird-Weather Spotter):** Notices when a season had crazy rain, heat, or dry days.
- **Helper 2 (Memory Matcher):** Finds past summers that look like dry, wet, or hot test scenarios.
- **Helper 3 (Naked-Dirt Counter):** Watches plants turn green and counts how many days the dirt had no plant blanket.
- **Helper 4 (Trend Watcher):** Checks if rainfall is slowly shifting over the years.
- **Helper 6 (The Scoreboard):** Adds up points using *your* priorities, shakes the scoreboard **2,000 times** to see if the winner stays the winner, and picks the safest backup plan if bad weather hits.
- **Helper 7 (The Receipt Maker):** Prints the **Evidence Passport** showing what data was used and what is still missing.
- **Helper 8 (The Careful Learner):** Only updates the scoreboard *after* a trained human extension officer checks a farmer's field report.
- **Helper 9 (The Phone-Camera Helper):** Lets your phone camera peek at the dirt **with zero internet** to tell if the ground is `Intact`, `Partial`, or `Bare`.

### Professional / Judge View — Statistical & Machine Learning Models (`M1–M9`)
| Model | Method | What It Answers |
| :--- | :--- | :--- |
| **M1 — Seasonal Anomaly** | Z-score maxima + `IsolationForest` (`n_estimators=150`) | How extreme was a season's rain, dry spell, heat, soil moisture, or bare exposure? |
| **M2 — Regime Clustering & Analogs** | `KMeans` (`3` regimes: `dry_stressed`, `moderate_variable`, `wet_vigorous`) + Euclidean analog lookup | Which past year (`driest`, `wettest`, `hottest`, `typical`) does a stress scenario match? |
| **M3 — NDVI Phenology & Bare Soil** | Cloud-masked (`cloud_prob <= 0.45`) smoothed 36-dekad NDVI curve | When do `Major` / `Minor` green-ups happen, and which dekads drop below `ndvi_smooth < 0.28` (bare)? |
| **M4 — Climate Trend** | Mann-Kendall test + Sen's slope (`mm/yr`) | Is seasonal rainfall trending drier or wetter over time (with `p_value` honesty)? |
| **M6 — MCDA + Monte Carlo + Minimax Regret** | Transparent weighted sum + `2,000`-run uncertainty perturbation + worst-case regret | Which rotation wins under the farmer's weights, and which loses least in bad weather? |
| **M7 — Evidence Passports** | Deterministic UUIDv5 provenance + Scale Honesty (`pixel/farm` ratio) | What data backed this score, what is missing, and is the satellite pixel too big for this farm? |
| **M8 — Conjugate Bayesian Calibration** | Closed-form Normal-conjugate updates (`officer_reviewed` / `expert_validated` only) | How do real field outcomes safely improve strategy priors without noisy unverified labels? |
| **M9 — On-Device Plot Vision** | Offline Skia `64×64` RGBA spectral indices (`ExG`, `NGRDI`, residue ratio) | From a phone photo in the field, is the ground `Intact`, `Partial`, or `Bare`? |

#### How Are `M1–M9` Exported & Deployed?
- **No heavy `.pkl` / `.onnx` server needed:**
  - **`M1`, `M2`, `M3`, `M4`, `M7`, `M8` (Offline Batch -> JSON + Supabase):** Run offline in Python (`pipeline/src/fieldshift/`), then `publish.py` exports precomputed features, 36-dekad timelines, analog lookups, and Evidence Passports to `pipeline/data/ashanti_pilot_bundle.json` and **Supabase (PostgreSQL + PostGIS)**.
  - **`M6` (Deterministic Code Parity):** Implemented directly in Python (`pipeline/`, `apps/api/scoring.py`) and TypeScript (`apps/web/src/lib/scoring.ts`, `apps/mobile/src/lib/scoring.ts` & `stress.ts`) with `1e-9` parity tested against `shared/test-vectors/`.
  - **`M9` (On-Device Mobile Bundle):** Bundled directly inside the mobile app (`apps/mobile/src/lib/vision-classifier.ts`) using **React Native Skia** (`skia-agronomic-v1`) so plot cover scans work offline, with a pluggable `VisionBackendId` for future quantized `.onnx`/`.tflite` weights.
- **In plain English:** Helpers `1–4, 7, 8` do their homework ahead of time and save the answers in a shared notebook; Helper `6` is instant math built right into the app; and Helper `9` lives inside your phone's camera code so it works in Airplane Mode.

---

## Slide 5 — 5 Ways to Take Turns Planting (Rotation Strategies)

Instead of planting only maize forever (`Baseline: Continuous Maize`), we compare **4 smarter crop team-ups**:
- **Cowpea, Groundnut & Soybean (Strategies A, C, D):** "Fertilizer-maker" legumes that pull nitrogen from the air and put it back into the soil, saving farmers real bags of urea fertilizer while breaking maize pest cycles.
- **Mucuna Mulch (Strategy B):** Grows a thick leaf blanket so the hot Harmattan wind doesn't dry out or blow away sloping soil.

---

## Slide 6 — Works Out on the Farm (Offline, SMS/Twi & Role PINs)

Out on the farm, internet bars vanish. So Field Shift:
- Packs **all Ashanti district cells** onto the phone before you leave town (`AsyncStorage` district packs).
- Lets farmers, MoFA extension officers, and CSIR-CRI agronomists sign in with a **phone number + 4-digit PIN** (`0512345601`/`1111`, `0512345602`/`2222`, `0512345603`/`3333`).
- Runs the **scoreboard (M6)** and **camera dirt-scanner (M9)** right on the phone in **Airplane Mode**, and sends short advice cards in **English and Ashanti Twi** over **SMS / USSD / WhatsApp**.

---

## Slide 7 — Challenge Requirements & Objectives Traceability Matrix

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
