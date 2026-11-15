# Field Shift Model Cards (M1–M8)

Structured documentation for the Ashanti Pilot Earth Observation & Decision Intelligence pipeline (`pipeline/src/fieldshift/`).

## M1 — Seasonal Anomaly Detector (`models/anomaly.py`)
- **Method:** Per-season z-score maxima blended (40%) with `IsolationForest` (`n_estimators=150`, `contamination` capped conservatively) over `total_rain_mm`, `longest_dry_spell_days`, `heat_stress_days`, `mean_sm_anomaly_z`, and `bare_period_fraction`.
- **Outputs:** `anomaly_score_m1` (`0..1`), `is_anomalous_season`, `baseline_z_max`, `anomaly_driver`.
- **Known Limitations:** Small multi-year sample sizes (< 4 cell-seasons per stratum) fall back gracefully to clipped z-score norms; anomalies highlight statistical extremes relative to 2022–2025 rather than crop yield loss directly.

## M2 — Hydrological Regime Clustering & Analog Retrieval (`models/clustering.py`)
- **Method:** Standardized `KMeans` (`n_clusters=3`, ordered deterministically into `dry_stressed`, `moderate_variable`, `wet_vigorous`) plus normalized Euclidean retrieval of historical `driest`, `wettest`, `hottest`, and `typical` analog seasons.
- **Outputs:** `cluster_id_m2`, `cluster_label_m2`, analog lookup summaries.
- **Known Limitations:** Analog similarity summarizes cell-level rainfall/heat/bare exposure; plot-specific drainage and planting dates shift realized crop outcomes.

## M3 — Unsupervised NDVI Phenology & Bare-Soil Detector (`models/phenology.py`)
- **Method:** Cloud-masked (`cloud_prob <= 0.45`), smoothed 36-dekad NDVI trajectory evaluated across Ashanti bimodal `major` (dekads 7–21) and `minor` (dekads 25–33) windows.
- **Outputs:** Major/minor green-up dekad, peak NDVI & peak dekad, bare-field exposure count and max consecutive bare dekads (`ndvi_smooth < 0.28`).
- **Known Limitations:** 250 m MODIS/HLS composites mix neighbouring smallholder plots and suffer heavy wet-season cloud gaps (flagged via `qa_tier = 'low_cloud_gap'`).

## M4 — Rainfall & Climate Trend Estimator (`models/trends.py`)
- **Method:** Non-parametric Mann-Kendall trend test (`pymannkendall`) with Sen's slope (`trend_sen_slope_mm_yr`) per cell and season.
- **Outputs:** Trend direction, Sen's slope (mm/yr), statistical `p_value`.
- **Known Limitations:** Short 4-year baselines lack statistical power for multi-decadal attribution; treated as directional context alongside NASA POWER baselines.

## M6 — Agronomic Decision Fusion & Climate Stress-Testing (`decision/m6_fusion.py`, `decision/stress_test.py`)
- **Method:** Transparent weighted-sum MCDA (`base_scores`) + 2,000-run Monte Carlo score/weight perturbation (`rank_probabilities`) fusing cited Ashanti crop/rotation priors (`knowledge/*.csv`) with seasonal rainfall margin, WaPOR-style Water Satisfaction Index (`P / ET0`), cumulative evaporative deficit (`max(ET0 - P)`), rainfall-SMAP-NDVI flash-drought decoupling (`detect_flash_drought_dekads`), biological N-fixation urea bag savings (`urea_bags_saved = kg_N / 23.0`), Harmattan bare-days avoided, terrain slope vs. `max_slope_recommended_pct`, soil pH (via optional 30 m **iSDAsoil v2** or **SoilGrids 250 m**), and **Minimax Climate Regret** (`evaluate_minimax_regret`) across stress presets.
- **Parity:** Matches `apps/api/scoring.py`, `apps/web/src/lib/scoring.ts`, and `apps/mobile/src/lib/scoring.ts` within `1e-9` on base scores; mobile mirrors stress perturbations & Minimax Regret in `apps/mobile/src/lib/stress.ts`.
- **Known Limitations:** Criterion scores carry explicit `score_uncertainties` reflecting unverified priors (`pending_local_review`), missing plot lab assays, and coarse sensor footprints.

## M7 — Epistemic Evidence Passports (`evidence/m7_passport.py`)
- **Method:** Deterministic UUIDv5 passport generation linking every strategy recommendation in Supabase (`evidence_passports` ← `strategy_scores.passport_id`) to dataset provenance (`live` vs. `synthetic_pilot`), excluded US-only baselines (`NON_GLOBAL_US_BASELINES`), scale-honesty gaps, and required MoFA/CSIR-CRI local review checks.

## M8 — Controlled Conjugate Bayesian Outcome Calibration (`models/feedback.py`)
- **Method:** Closed-form Normal-conjugate posterior updating (`calibrate_strategy_scores_with_feedback`) that shifts strategy criterion means and tightens posterior uncertainty sigmas **strictly** from outcome reports graded `officer_reviewed` (`σ_obs = 0.12`) or `expert_validated` (`σ_obs = 0.08`) with `eligible_for_model_update = True`.
- **Governance:** Mirrors Supabase RLS on `outcome_reports`; unverified `farmer_reported` logs (`eligible_for_model_update = False`) are persisted for officer review and strictly excluded from weight/prior updates (`ignored_unverified_reports`).
- **Known Limitations:** Relies on structured officer grading of water stress, soil cover, erosion, and yield outcomes; does not adjust regional hydrological climatologies directly.

## M9 (Edge) — On-Device Plot Cover & Stress Vision Classifier (`apps/mobile/src/lib/vision-classifier.ts`)
- **Method:** 100% offline Skia offscreen `64×64` RGBA readback (`classifyPlotImageUri`) + spectral-index classification (`classifyRgbaPatch`) using Excess Green (`ExG = 2g - r - b`), Normalized Green-Red Difference (`NGRDI`), and brightness/redness residue separation behind a pluggable `VisionBackendId` (`skia-agronomic-v1`, ready for quantized ONNX/TFLite).
- **Outputs:** Auto-populates `soilCover` (`Intact` / `Partial` / `Bare`), `waterStressHint` (`None` / `Mild` / `Severe`), `canopyPct`, `mulchPct`, `barePct`, and `confidence` on mobile Field Outcome Reports.
- **Known Limitations:** Spectral color indices can be affected by harsh noon shadows or wet dark soils; farmers and extension officers can always override the suggested pills before submitting.

---

## Validation, Stability & Uncertainty Metrics (`models/validation.py`)

Measured across the 5 Ashanti pilot cells × 4 years (`2022–2025`, `n_pairs = 720` dekad pairs):

| Check | Observed Outcome | What It Proves & Honest Caveats |
| :--- | :--- | :--- |
| **M2 Bootstrap Cluster Stability** (`n_bootstrap = 25`) | `mean_stability = 0.9579` (`95.8%`) | **Strong:** Hydrological regime assignments (`dry_stressed`, `moderate_variable`, `wet_vigorous`) remain highly consistent under resampling. |
| **M1 & M2 Leave-One-Year-Out** (`years_tested = 4`) | `mean_anomaly_score_shift = 0.1463`, `cluster_label_agreement = 0.7222` (`72.2%`) | **Reasonable for a 4-year window:** Shows expected sensitivity when 1 of 4 years is held out, reinforcing why M4 reports `p_value` and M7 requires local expert review rather than claiming multi-decadal attribution. |
| **Cross-Source Rainfall Agreement** (`evaluate_rainfall_source_agreement`) | `pearson_r = 0.9919`, `mae_mm = 3.7`, `bias_pct = 0.98%` | **Pipeline verification caveat:** On the synthetic pilot generator (`generate_ashanti_pilot_raw_daily`), IMERG and ERA5 share a base signal, so `0.99` verifies QC/harmonization rather than live Ghana satellite agreement (live IMERG vs. ERA5 agreement is naturally lower). |
| **M6 Cross-Language Parity & Robustness** | `1e-9` base-score & `2e-4` stress-test parity; `2,000`-run Monte Carlo rank stability + Minimax Regret | **Strong:** Python (`pipeline/`, `apps/api`), Web (`apps/web`), and Mobile (`apps/mobile`) compute identical scores offline and online, and surface rank uncertainty instead of hiding behind a single point estimate. |
| **Supervised Yield Accuracy** | *Not claimed* | **Intentional gap:** No farm-level harvest RMSE/F1 is claimed without verified Ashanti yield labels—**M7** (Evidence Passports) and **M8** (officer-gated Bayesian calibration) exist specifically to bridge this safely. |
