# ScalarField Mobile App (`apps/mobile`)

Expo SDK 58 (React Native `0.88.1` + Expo Router) field companion for farmers, extension officers, and agronomists in the **Ashanti Region, Ghana** 50 × 50 km pilot grid.

Works offline-first with local district packs, deterministic TypeScript MCDA & Minimax Regret scoring (`1e-9` parity with Python), and optional cloud sync / AI Advisor chat.

## Demo Credentials (`/login`)

| Role | Phone Number | 4-Digit PIN | Capabilities |
| :--- | :--- | :--- | :--- |
| **Farmer** (`farmer`) | `0512345601` | `1111` | Ashanti EO baselines, 36-dekad calendar, strategy comparison, camera plot scan, offline decision/outcome logging |
| **Extension Officer** (`extension_officer`) | `0512345602` | `2222` | Farmer views + Officer Review grading (`officer_reviewed` / `confounded_excluded`) |
| **Agronomist** (`agronomist`) | `0512345603` | `3333` | Senior validation (`expert_validated`) + M8 calibration oversight |

## Screens & Navigation (`src/app/`)

- **Home** (`(tabs)/index.tsx`):
  - Interactive **Ashanti 5×5 km Grid Map** (`src/components/ashanti-map-preview.tsx` / `.web.tsx`) for switching between Ejura, Mampong, Offinso, and Sekyere Central cells.
  - KPI metric cards (Soil Moisture, Air Temp, Soil Temp, Canopy Cover), **Soil Moisture Trajectory** chart, Smart Insights, and **Scale Honesty** launcher.
- **Calendar** (`(tabs)/calendar.tsx`):
  - Top segmented filter bar (`All Windows`, `Bare Risk`, `Cloud QA`, `Dekad Windows`).
  - **36-Dekad Exposure Calendar** (`src/components/dekad-heatmap-matrix.tsx`) showing 10-day rainfall, NDVI, bare-field risk, and cloud QA windows.
  - Animated collapsible bento grid cards for **Vegetation Cover & Moisture**, **Air & Surface Temperature**, and **Rainfall vs. ET₀ Demand**, plus a plain-language glossary.
- **Compare** (`(tabs)/compare.tsx`):
  - Priority weight controls, 4-strategy comparison (Baseline + Strategies A–C), climate stress-test sliders, and Monte Carlo rank stability / Minimax Regret rankings.
- **Passport** (`(tabs)/passport.tsx`):
  - Evidence Passport cards, camera plot canopy scan (`classifyRgbaPatch`), and offline decision/outcome logging synced via the bottom-right Sync button.
- **ScalarField AI Advisor Chat** (`chat.tsx`):
  - Launched from the floating center button in the custom bottom tab dock (`src/components/app-tabs.tsx`). Connects to the OpenRouter + deterministic MCDA pipeline chat endpoint (`/api/chat`) with quick prompts and one-tap **Apply to Compare Studio**.
- **Scale Honesty** (`scale-honesty.tsx`):
  - Interactive parcel-area stepper and **Scale Footprint Diagram** (`src/components/scale-footprint-diagram.tsx`) comparing farm size against SMAP (9 km), SRTM (30 m), and HLS (30 m) pixels.

## Local Development & Verification

```bash
# Install dependencies
npm --prefix apps/mobile install

# Start Expo dev server (iOS, Android, Web)
npm --prefix apps/mobile start

# Typecheck & run deterministic scoring / auth / RGBA tests
cd apps/mobile && npx tsc --noEmit && npm test
```

## Building with EAS (`eas.json`)

- **Development client (internal):** `cd apps/mobile && eas build --platform ios --profile development`
- **Preview (internal):** `cd apps/mobile && eas build --platform ios --profile preview`
- **Production `.ipa` (store, no auto-submit):**
  ```bash
  cd apps/mobile && eas build --platform ios --profile production --non-interactive
  ```
