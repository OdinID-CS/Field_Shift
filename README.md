# Field Shift 🌍🌱

### Evidence-graded crop-rotation decision support for a changing climate, powered by NASA Earth observations

**NASA Space Apps Challenge 2026 · Challenge: _Field Shift: Adapting Farms with NASA Data_**
**Initial focus region: Ashanti Region, Ghana**
**Live Web & API Deployment: [https://fieldshift.vercel.app](https://fieldshift.vercel.app)**

### Challenge Demo Credentials (Mobile & Web `/login`)

| Role | Phone Number | 4-Digit PIN | Capabilities |
| :--- | :--- | :--- | :--- |
| **Farmer** (`farmer`) | `0512345601` | `1111` | Explore Ashanti strategies, stress tests, offline district packs, camera plot scan, log decisions & unverified outcomes |
| **Extension Officer** (`extension_officer`) | `0512345602` | `2222` | All farmer views + Officer Review grading (`officer_reviewed` / `confounded_excluded`) for M8 calibration |
| **Agronomist** (`agronomist`) | `0512345603` | `3333` | Senior validation (`expert_validated`) + M8 calibration & CSIR-CRI local review oversight |

---

## In one paragraph

Field Shift helps farmers explore crop-rotation strategies that could protect soil, conserve water and cope with changing weather. It turns NASA satellite data into a **seasonal vulnerability calendar** for a farm area, then compares **at least three rotation strategies, including the farmer's existing rotation**, scored against **the farmer's own priorities**. Every recommendation ships with an **Evidence Passport**: what supports it, how confident we are, what we don't know, and what local experts must check before anyone acts on it.

> **Farmers stay at the centre of every decision.** Field Shift supports agricultural expertise. It does not replace it, and it does not issue unexplained instructions.

---

## Table of contents

1. [The problem](#-the-problem)
2. [Why Ashanti, Ghana](#-why-ashanti-ghana)
3. [What makes Field Shift different](#-what-makes-field-shift-different)
4. [How it works](#-how-it-works)
5. [Rotation strategy comparison](#-rotation-strategy-comparison)
6. [Data sources](#-data-sources)
7. [Machine learning and analytics](#-machine-learning-and-analytics)
8. [Farmer-centred design](#-farmer-centred-design)
9. [Scientific integrity and explainability](#-scientific-integrity-and-explainability)
10. [Learning from field outcomes](#-learning-from-field-outcomes)
11. [Challenge requirements map](#-challenge-requirements-map)
12. [Concepts explained simply](#-concepts-explained-simply)
13. [Architecture](#-architecture)
14. [Project status and roadmap](#-project-status-and-roadmap)
15. [Limitations](#-limitations)
16. [Responsible data use](#-responsible-data-use)
17. [References](#-data-and-references)
18. [Team and license](#-team-and-license)

---

## 🌍 The problem

Farmers worldwide face unpredictable rainfall, rising temperatures and heat stress, soil moisture swings, water shortages, erosion, nutrient depletion and declining soil health. These pressures make a basic question harder every year:

> **What should I grow next, and in what order, so that my soil and my income hold up under changing conditions?**

A crop that restores soil in one place may drain water, invite disease, miss the local market or clash with the growing season somewhere else. Satellites observe all of this, but raw satellite data does not answer the farmer's question. **The gap is translation**: from pixels and time series to a locally meaningful, honest, farmer-friendly comparison of options.

---

## 🌱 Why Ashanti, Ghana

Ashanti sits in Ghana's forest and forest-transition zones. Conditions that make it a strong, demanding test case:

- **Two rainy seasons** (broadly March to July and September to November), so planting-window timing matters a great deal.
- **Heavy cloud and humidity**, which leave gaps in optical satellite records. A real data-quality challenge we address directly.
- **Rainfed, smallholder-dominated farming.** Many farms are smaller than a coarse satellite pixel, so scale honesty matters.
- **Mixed cropping systems** (maize, cassava, yam, plantain, legumes, vegetables and perennial tree crops such as cocoa).
- **Real exposure to climate variability**: shifting rainy-season onset, dry spells within seasons, heat stress and soil erosion on slopes.

Most example datasets in the challenge brief are US-only (CDL, Web Soil Survey, SSURGO, PRISM, OpenET and others). We deliberately use **globally available NASA and partner datasets**, so the approach can travel beyond Ghana.

---

## ✨ What makes Field Shift different

| # | Innovation | What it does | Why it matters |
| - | ---------- | ------------ | -------------- |
| 1 | **Evidence Passport** | Every strategy and finding carries evidence tier, data used, coverage, method, uncertainty, gaps and required expert review. | Moves from "black-box recommendation" to **auditable decision support**. |
| 2 | **Vulnerability and Bare-Field Calendar** | A week-by-week or dekad-by-dekad view of rainfall reliability, soil moisture, vegetation cover, heat and erosion exposure. | Shows _when_ fields are exposed or stressed, which is the brief's core ask. |
| 3 | **Priority-weighted transparent scoring** | Farmers set priorities (water, income, soil health, labour, market, erosion). Strategies are scored with visible, adjustable weights. | The tool adapts to the farmer's values, not the other way round. |
| 4 | **Rank-stability & minimax regret** | Weights, inputs and climate assumptions are perturbed (Monte Carlo rank stability + worst-case minimax climate regret across weather presets). | Tells the farmer when a recommendation is robust, lowest-regret, or a toss-up. |
| 5 | **Climate stress-testing** | Rainfall and temperature sliders, flash-drought decoupling checks, and replay of historical analog seasons (driest, wettest, hottest). | Lets farmers ask "what if next season is dry?" without any forecasting claims. |
| 6 | **Scale-honesty layer** | Compares each dataset's pixel footprint (e.g., 30 m iSDAsoil/HLS vs. 250 m SoilGrids/MODIS vs. 9 km SMAP) with the farm area and flags coarse pixels. | Prevents over-claiming farm-level precision from coarse data. |
| 7 | **Controlled feedback loop** | Farmer decisions and outcomes are logged offline/online, quality-graded by extension officers (`M8` Normal-conjugate calibration only on verified grades). | Turns local experience into evidence without polluting models with noisy labels. |
| 8 | **Low-bandwidth EN + Twi cards** | Short `<320`-char summary cards in plain English and Ashanti Twi (with urea-bag N-fixation savings & bare-days avoided), shareable over SMS/WhatsApp. | Usable by farmers and extension officers with limited connectivity or technical background. |
| 9 | **AI Advisor Chat (`/api/chat`)** | Mobile floating chat modal (`apps/mobile/src/app/chat.tsx`) backed by OpenRouter + deterministic MCDA pipeline scoring (`/api/chat`), returning grounded strategy cards that apply directly to Compare Studio. | Lets farmers ask natural-language questions while keeping every score, urea estimate, and scale-honesty note deterministically grounded. |

---

## ⚙️ How it works

```text
 NASA Earth observations + partner datasets + local agronomic knowledge
                              |
                              v
              Data acquisition and quality control
        (cloud masking, gap-filling, QA flags, versioning)
                              |
                              v
             Harmonisation onto a common analysis grid
        (resample / aggregate to shared space and time steps)
                              |
                              v
                     Feature engineering
   (anomalies, rainfall reliability, dry-spell length, vegetation
    phenology, heat-stress days, slope and erosion exposure ...)
                              |
              +---------------+----------------+
              |                                |
              v                                v
     Environmental intelligence       Agronomic knowledge base
  (patterns, anomalies, trends,        (crop water needs, season
   seasonal windows, zones)             lengths, N-fixation, pests,
              |                          erosion cover, markets)
              +---------------+----------------+
                              |
                              v
                   Intelligence fusion layer
      (transparent multi-criteria scoring + farmer priorities)
                              |
                              v
        Rotation strategy comparison (3+ strategies incl. existing)
                              |
                              v
         Evidence Passport + uncertainty + required local review
                              |
                              v
        Farmer and expert review  -->  logged decisions and outcomes
                              |
                              v
        Evidence grading  -->  controlled model and knowledge updates
```

**Design principle:** satellite data describes _conditions_. Agronomic knowledge describes _crop requirements_. Farmer input describes _priorities and constraints_. Field Shift fuses the three transparently and never claims satellite data alone can predict yield or rotation success.

---

## 🔄 Rotation strategy comparison

The challenge asks for a comparison of **at least three strategies, including the existing rotation**. For each strategy, Field Shift produces a standard comparison card.

### Illustrative candidate strategies for Ashanti

> These are **starting hypotheses** drawn from common regional practice. They are _not_ validated recommendations. Final candidates will be defined with agronomic literature and local expert input.

| Strategy | Concept | Illustrative rationale |
| -------- | ------- | ---------------------- |
| **Baseline: existing rotation** | Entered by the farmer, for example continuous maize or maize followed by fallow. | Everything is compared against what the farmer already does. |
| **Strategy A: cereal-legume rotation** | Maize alternating with cowpea, groundnut or soybean. | Nitrogen fixation, reduced fertiliser need, pest-cycle interruption, extra income. |
| **Strategy B: soil-cover emphasis** | Add cover crop or mulch phases to shorten bare-field periods, especially on sloping land. | Erosion reduction, organic matter, improved infiltration. |
| **Strategy C: water-resilience emphasis** | Shift toward drought-tolerant crops or varieties and adjust planting windows to rainfall reliability. | Lower exposure to mid-season dry spells and heat stress. |

Perennial systems such as cocoa are handled as a separate land-use context, because rotation logic does not apply to them in the same way.

### What every comparison card contains

- **Why it was suggested** (the satellite signal and the agronomic reasoning)
- **Evidence supporting it** (datasets, coverage, method, evidence tier)
- **Expected benefits** (soil, water, erosion, pests, income, labour)
- **Information gaps** (what we could not observe or verify)
- **Risks needing local review** (disease, market access, seed availability, equipment, labour)
- **Priority fit** (score against the farmer's chosen priorities)
- **Ranking stability** (does this ranking hold under changed weights or climate scenarios?)
- **Confidence level** and **who should validate it** (farmer, extension officer, agronomist)

### Scoring criteria (initial, transparent, adjustable)

Water-use efficiency · Drought and heat exposure · Soil health (N-fixation, organic matter) · Erosion protection · Pest and disease-cycle disruption · Income and market suitability · Labour and equipment fit · Seasonal-window fit.

Every score is **traceable to its inputs**. Where an input is missing or weak, the criterion is marked low-confidence rather than silently filled in.

---

## 🛰️ Data sources

### Core NASA datasets

| Dataset | Used for | Approx. resolution | Key limitation we address |
| ------- | -------- | ------------------ | ------------------------- |
| **GPM IMERG** | Rainfall amounts, onset, dry spells, extreme-rain events | ~10 km, sub-daily | Satellite rainfall has errors; validate against local gauges where available. |
| **SMAP** | Surface soil moisture, drought stress signals | ~9 to 36 km, every 2 to 3 days | Coarse, surface-only. We present it as regional context, not field measurement. |
| **Landsat** | Vegetation vigour, bare ground, seasonal change | 30 m, ~16-day revisit | Cloud gaps in Ashanti. Mitigated with MODIS/VIIRS and gap-filling. |
| **MODIS / VIIRS** | Frequent NDVI/EVI time series, phenology | 250 m to 1 km, daily to near-daily | Mixed pixels on smallholder farms. |
| **NASA POWER** | Temperature, humidity, radiation, agroclimate | Coarse gridded | Regional, not farm-level. |
| **SRTM** | Slope, runoff paths, erosion exposure | ~30 m | Static terrain only. |
| **ECOSTRESS** | Land-surface temperature, evapotranspiration, heat-stress hotspots | ~70 m | Irregular, patchy coverage. Used as supporting evidence, not a continuous record. |
| **GRACE / GRACE-FO** _(optional)_ | Long-term regional water-storage trends | Very coarse | Too coarse for farm decisions. Context only. |

### Partner and non-NASA datasets (to fill gaps outside the US)

| Dataset | Used for |
| ------- | -------- |
| **ISRIC SoilGrids** | Soil texture, organic carbon, pH (global gridded estimates) |
| **FAO GAEZ** | Crop suitability and agro-ecological constraints |
| **ERA5** (ECMWF) | Continuous climate time series, gap-filling where stations are sparse |
| **CHIRPS** _(optional)_ | Long-record rainfall cross-check |
| **Copernicus Sentinel-2** _(optional)_ | Finer vegetation detail (10 to 20 m) |
| **Local knowledge** | Ghanaian agricultural research and extension sources, farmer interviews, local crop calendars |

> Data availability, resolution, quality flags and product versions are recorded for every analysis and surfaced in the Evidence Passport. Where a dataset cannot support a claim at farm scale, the scale-honesty layer says so.

---

## 🧠 Machine learning and analytics

Machine learning is used **where it is defensible** and baselines come first. We do not pretend to train supervised yield or rotation-success models without labelled field outcomes.

| Capability | Approach | Role |
| ---------- | -------- | ---- |
| Unusual-season and anomaly detection | Isolation Forest, plus simple statistical baselines (z-scores, percentiles) | Flag abnormal rainfall, heat or vegetation behaviour |
| Season-type and zone discovery | K-means (or comparable clustering) on harmonised features | Group seasons and areas with similar environmental behaviour |
| Rainfall and temperature trends | Seasonal decomposition, trend tests, time-series baselines (e.g. ETS/ARIMA-family) | Describe change and variability. Not marketed as precise forecasts |
| Environmental relationships | Regression with uncertainty reporting | Explore associations. Correlation is never presented as causation |
| Crop and rotation assessment | **Transparent multi-criteria scoring** with agronomic knowledge and farmer priorities | The decision layer. Explainable by construction |
| Robustness | Weight perturbation and scenario sampling | Rank-stability testing |

**Evaluation commitments:** every model is compared against a simple baseline, evaluated with time-aware validation (no leakage from future seasons), and reported with its limits.

---

## 👩🏾‍🌾 Farmer-centred design

- **Priority inputs:** water availability, income and market goals, soil-health goals, erosion concerns, labour and equipment limits, seed access.
- **Plain-language outputs:** short summaries, icon-supported cards, glossary tooltips.
- **Map exploration:** vegetation, soil moisture, rainfall and terrain layers with timelines and dataset overlays.
- **Planned accessibility:** Twi-language summaries, printable one-page cards, low-bandwidth mode for extension-officer use.
- **Reminders where judgment matters:** the interface highlights decisions that need local expertise, such as disease risk, market access and variety choice.
- **Co-design:** farmer and agronomist feedback shapes criteria, language and workflow from the start.

---

## 🔍 Scientific integrity and explainability

Every finding communicates:

1. What was observed
2. Which datasets were used
3. The spatial and temporal coverage
4. Which method was applied
5. What the result suggests
6. How uncertain it is
7. What limitations apply
8. What further evidence or expert validation is needed

### Evidence tiers

| Tier | Meaning |
| ---- | ------- |
| **Established science** | Well-supported agronomic or environmental knowledge |
| **Data-derived finding** | Statistical result from the datasets, with stated uncertainty |
| **Farmer-reported observation** | Valuable local evidence, not yet independently validated |
| **Unverified hypothesis** | Plausible, flagged for testing |
| **Expert-validated insight** | Confirmed by agricultural experts in context |

Principles we hold to:

- NASA observations are **not** ground truth for yield or rotation success.
- Satellite pixels are **not** presented as exact farm-level measurements when resolution does not support it.
- Correlation is **not** presented as causation.
- Uncertainty is shown, never hidden.

---

## 🔁 Learning from field outcomes

1. Analyse environmental and agricultural information.
2. Present findings and candidate strategies.
3. Farmers and experts evaluate the options.
4. Record the decision and the reasoning behind it.
5. Collect observations of the resulting outcomes.
6. **Grade the evidence** for reliability and context (pests, management, rainfall, soil, seed quality).
7. Incorporate only validated observations into future model and knowledge-base updates.

Not every observation becomes a training label. Farmer experience is treated as valuable evidence even before scientific validation, and it is tagged accordingly.

---

## ✅ Challenge requirements map

| Challenge expectation | How Field Shift addresses it |
| --------------------- | ---------------------------- |
| Use NASA Earth observations with local soil, crop and farmer-priority information | NASA datasets (IMERG, SMAP, Landsat, MODIS/VIIRS, POWER, SRTM, ECOSTRESS) plus SoilGrids, GAEZ, local knowledge and farmer inputs |
| Compare at least three rotation strategies, including the existing one | Standard comparison cards: baseline plus alternative strategies |
| Explain why each was suggested, supporting evidence, benefits, gaps and risks | Evidence Passport on every strategy |
| Highlight bare-field periods and seasonal vulnerability | Vulnerability and Bare-Field Calendar |
| Map strategies to farmer priorities (water, income, soil structure) | Priority-weighted transparent scoring |
| Explain how the model handles uncertainty and where local expertise is needed | Confidence levels, rank-stability testing, required-local-review flags |
| Harmonise datasets of different resolutions | Common analysis grid with documented resampling and a scale-honesty layer |
| Interactive maps, timelines, overlays and scenario sliders | Planned map explorer with layers, timeline and rainfall/temperature sliders |
| Explain scientific terms and satellite versus ground measurements | Built-in glossary and data-limits explainers |
| Support, not replace, local expertise | Design principle, repeated reminders in the interface |

---

## 📖 Concepts explained simply

| Term | Plain meaning |
| ---- | ------------- |
| **NDVI** | A satellite "greenness" score. Higher usually means denser, healthier vegetation. Low values in a growing season can signal stress or bare ground. |
| **Evapotranspiration (ET)** | Water leaving the field through soil evaporation and plant transpiration. High ET with low rainfall means water stress. |
| **Soil moisture anomaly** | How much wetter or drier the soil is than normal for that time of year. |
| **Dry spell** | A run of days with little rain during the growing season, often more damaging than low seasonal totals. |
| **Rainfall reliability** | How consistently the rains arrive in the expected window across years. |
| **Bare-field period** | Time when no crop or cover protects the soil, raising erosion and moisture-loss risk. |
| **Nitrogen-fixing crop** | A legume that works with soil bacteria to add nitrogen, which can reduce fertiliser needs. |
| **Satellite vs ground data** | Satellites see wide areas consistently but at coarse resolution and with indirect measurements. Ground measurements are precise but sparse. Field Shift is designed to combine them. |

---

## 🏗️ Architecture

Field Shift follows a modular design that separates **data acquisition, processing, analytics, agronomic knowledge, decision support and feedback**.

| Layer | Responsibility |
| ----- | -------------- |
| Data acquisition | Fetch and version NASA and partner datasets, record provenance |
| Quality and harmonisation | Cloud masking, QA flags, gap-filling, resampling to a common grid |
| Feature engineering | Anomalies, dry spells, phenology, heat-stress days, terrain exposure |
| Analytics | Anomaly detection, clustering, trends, regression |
| Knowledge base | Crop requirements, rotation principles, regional calendars (version-controlled, sourced) |
| Decision layer | Multi-criteria scoring, priority weights, rank-stability testing |
| Evidence layer | Evidence Passport generation, uncertainty and gap reporting |
| Interface | Maps, calendar, scenario sliders, comparison cards, glossary |
| Feedback | Decision and outcome logging, evidence grading |

> **Implemented technology stack:** Next.js 16 (App Router, TypeScript, Tailwind CSS) + FastAPI on Vercel (`https://fieldshift.vercel.app`), Expo SDK 58 / React Native `0.88.1` (`apps/mobile`) with EAS Build, Supabase (PostgreSQL + PostGIS + RLS), and an offline Python geospatial/ML pipeline (`pipeline/`).

---

## 🚧 Project status and roadmap

Field Shift is under active development for the NASA Space Apps Challenge 2026. **Capabilities below are planned unless marked otherwise.** Nothing here should be read as completed or scientifically validated until it is demonstrated.

See [docs/BUILD_PHASES_AND_WORK_SPLIT.md](docs/BUILD_PHASES_AND_WORK_SPLIT.md) for the detailed breakdown of deliverables, integration gates, and work assignments.

| Phase | Goal | Primary Owner | Status |
| ----- | ---- | ------------- | ------ |
| 0. Repo & scoring parity | Monorepo structure, Next.js + Expo SDK 58 + FastAPI scaffolds, `1e-9` scoring parity | `kaliblip` + `OdinID-CS` | ✅ Done |
| 1. Foundations & ingestion | Supabase schema, Ashanti pilot bbox, NASA/iSDAsoil/SoilGrids ingest, QC cube, priority inputs | `kaliblip` (pipeline/mobile) · `OdinID-CS` (web inputs) | ✅ Done |
| 2. Environmental intelligence & core visuals | Harmonised features (WaPOR `P/ET0`, flash drought), M1–M4 models, `knowledge/` CSVs, Web Calendar & Map | `kaliblip` (ML/knowledge) · `OdinID-CS` (calendar/map/scale UI) | ✅ Done |
| 3. Decision & evidence layer | M6 fusion (N-fixation urea savings), M7 Passports, seeded Supabase, comparison cards, mobile & glossary | `kaliblip` (M6/M7/mobile) · `OdinID-CS` (cards/passport/glossary) | ✅ Done |
| 4. Stress-testing & offline | Analog season replay, minimax regret, climate sliders, mobile offline cache & decision/outcome queue | `kaliblip` (analogs/regret/mobile) · `OdinID-CS` (sliders/PWA/print) | ✅ Done |
| 5. Validation, localization & demo | Time-aware validation, M1–M8 model cards, mobile EN/Twi SMS export, Web i18n, officer workflow, multi-service Vercel deploy (`https://fieldshift.vercel.app`) | `kaliblip` (validation/mobile/api) · `OdinID-CS` (i18n/officer/web) | ✅ Done |
| 6. Scientific enhancements & scale-out | M8 conjugate Bayesian outcome updating (`models/feedback.py`), live Africa's Talking SMS/USSD & WhatsApp webhooks, OpenRouter + deterministic MCDA AI Advisor Chat (`/api/chat` + mobile modal), mobile `roofi` design system & Scale Honesty audit | `kaliblip` + `OdinID-CS` | ✅ Done |

### Planned demo story

1. A farmer in an Ashanti location enters their current rotation and priorities (for example water conservation and income).
2. The **Vulnerability Calendar** shows when their fields are bare or climate-exposed.
3. Field Shift compares the existing rotation with alternatives, with scores, evidence, gaps and risks.
4. The farmer adjusts a rainfall slider or replays a dry analog season. **Rank-stability** shows which strategy holds up.
5. The tool ends with a list of what a local agronomist must verify before acting.

---

## ⚠️ Limitations

- Satellite observations are indirect and often coarse relative to smallholder farms.
- Cloud cover reduces optical data availability in the region.
- Without labelled field outcomes, we cannot claim validated yield or rotation-success prediction.
- Soil estimates from global products are approximations and need local soil testing.
- Candidate strategies are hypotheses until reviewed by local agricultural experts.
- Market, labour, disease and seed-availability factors depend on local conditions that satellites cannot observe.

---

## 🔐 Responsible data use

- Farmer-provided data remains the farmer's. It is used only with consent and for stated purposes.
- Locations are handled at the lowest precision that serves the purpose.
- Datasets retain their original licences and attribution requirements.
- The tool presents options and evidence. It does not issue commands, and it does not guarantee outcomes.

---

## 📚 Data and references

- [NASA Earthdata](https://www.earthdata.nasa.gov/)
- [NASA POWER](https://power.larc.nasa.gov/)
- [NASA Global Precipitation Measurement (GPM)](https://gpm.nasa.gov/data)
- [NASA Soil Moisture Active Passive (SMAP)](https://smap.jpl.nasa.gov/)
- [NASA Landsat](https://landsat.gsfc.nasa.gov/)
- [Challenge page: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/)
- ISRIC SoilGrids, FAO GAEZ and ECMWF ERA5 (see each provider's site for access and licence terms)

---

## 👥 Team and license

**Team:**
- **kaliblip** — Mobile App (`apps/mobile`), ML & Earth Observation Pipeline (`pipeline`), Crop Knowledge & Decision Service (`knowledge`, `apps/api`)
- **OdinID-CS** — Web Application (`apps/web`), Interactive Map & Calendar Visualizations, Scenario & Evidence Passport UI

**License:** _to be specified_. NASA and partner datasets retain their own usage and attribution requirements.

---

**Field Shift: turning Earth observations into agricultural decisions farmers can trust.**
