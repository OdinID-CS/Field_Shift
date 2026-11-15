# Field Shift: project layout and dependency split

Status: active monorepo layout (updated 15 November 2026). All four test suites (`pipeline`, `apps/api`, `apps/web`, `apps/mobile`) run in CI.

## Repository layout (one repo, web, mobile, optional API, one offline pipeline)

```text
field-shift/
├── apps/
│   ├── web/                  Next.js app (Vercel project 1, Root Directory: apps/web; includes `/api/chat` OpenRouter + MCDA endpoint)
│   ├── mobile/               React Native (Expo SDK 58) app ("ScalarField", EAS build configured in `eas.json`, floating AI Advisor Chat modal)
│   └── api/                  Optional FastAPI decision service (Vercel project 2, Root Directory: apps/api)
│       ├── index.py          Defines the top-level `app` that Vercel loads
│       ├── scoring.py        numpy-only scoring and rank probabilities
│       ├── requirements.txt  LEAN runtime dependencies only
│       ├── .python-version
│       ├── .vercelignore
│       └── tests/
├── pipeline/                 Offline Python. Never deployed.
│   ├── requirements.txt      Heavy geospatial and ML dependencies
│   ├── config/pilot.yaml     Region settings (one file per region)
│   ├── src/fieldshift/       ingest, qc, features, models, decision, evidence
│   ├── notebooks/
│   └── tests/
├── knowledge/                Crop knowledge table (CSV). Every row cited and expert-reviewed.
├── supabase/migrations/      Database schema, PostGIS, row-level security policies
├── shared/test-vectors/      JSON fixtures (`scoring_basic.json`, `stress_test_basic.json`) for Python/TS parity
├── .github/workflows/ci.yml  CI pipeline running pipeline, API, web, and mobile checks
└── docs/                     Build phases, work split, and model cards
```

## Team Ownership & Work Split

See [docs/BUILD_PHASES_AND_WORK_SPLIT.md](docs/BUILD_PHASES_AND_WORK_SPLIT.md) for the full phased build plan and integration gates.

| Developer | OS | Primary Ownership |
| --- | --- | --- |
| **`kaliblip`** | macOS | Mobile app (`apps/mobile/`), offline ML & Earth observation pipeline (`pipeline/`), crop knowledge base (`knowledge/`), optional FastAPI service (`apps/api/`), Supabase migrations/ingest (`supabase/`) |
| **`OdinID-CS`** | Linux | Web application (`apps/web/`): MapLibre/Recharts visualizations, Vulnerability Calendar, Strategy Comparison & Scenario Sliders, Evidence Passport & Glossary UI, `next-intl` (EN/Twi), PWA offline cache, Vercel deploy |

## Dependency rules

| File | Used by | Rule |
| --- | --- | --- |
| `apps/api/requirements.txt` | Vercel decision service | fastapi, pydantic, numpy only. Add pandas or lightgbm only after measuring the bundle. |
| `pipeline/requirements.txt` | Your laptop, Colab, scheduled jobs | Everything heavy lives here: rasterio, geopandas, xarray, dask, zarr, scikit-learn, scipy, mlflow. |

Why the split matters: Vercel's current docs give Python functions a 500 MB uncompressed limit, and by default Python functions include every file reachable at build time, with no tree-shaking. A single shared requirements file would pull the geospatial stack into the service.

## Deployment

1. Hackathon: deploy only `apps/web`. Scoring and rank probabilities run in TypeScript from precomputed grids in Supabase. No Python server, no Docker.
2. Optional later: deploy `apps/api` as a second Vercel project from the same repo, with Root Directory set to `apps/api` (verify in Vercel project settings). Vercel's docs also describe a Services feature for running a Python API alongside Next.js in one project (verify setup before choosing it).
3. Vercel finds the entrypoint in files such as `index.py`, `app.py` or `main.py`, which must define a top-level `app`. It reads dependencies from `requirements.txt` or `pyproject.toml`.
4. The free Hobby plan is for personal, non-commercial use.

## Day-one check (do this before building on top)

1. Deploy `apps/api` as it is. Open `/api/health`, then POST to `/api/score`.
2. Set the environment variable `VERCEL_ANALYZE_BUILD_OUTPUT=1`, redeploy, and read the size breakdown in the build logs.
3. Confirm Python 3.12 is accepted (the file `apps/api/.python-version`). If not, use a supported version listed in Vercel's docs.

## Keeping TypeScript and Python scoring in agreement

- `shared/test-vectors/scoring_basic.json` holds a deterministic weighted-sum check; Python (`pipeline/` & `apps/api`) and TypeScript (`apps/web` & `apps/mobile`) must reproduce `expected_base_scores` to `1e-9`.
- `shared/test-vectors/stress_test_basic.json` holds climate stress-test perturbation and Minimax Regret parity checks (`2e-4` tolerance for half-to-even vs. half-up rounding).
- Monte Carlo rank probabilities are compared within statistical tolerance, because random generators differ between languages. All four suites run automatically in `.github/workflows/ci.yml`.

## Developer Setup (macOS & Linux)

### 1. Python 3.12 Virtual Environment (`.venv`)

Use **Python 3.12** (matching `apps/api/.python-version` for Vercel and ensuring prebuilt binary wheels on macOS and Linux for `rasterio`, `geopandas`, `pyproj`, `netCDF4`, `scipy`, `scikit-learn`, `lightgbm`, `shap`, and `aquacrop`). Newer Python versions such as `3.14` may lack prebuilt wheels for parts of the geospatial/ML stack.

#### Step 1 — Install Python 3.12 (or skip to Option B using `uv`)

- **macOS (primary developer):**

  ```bash
  # Check if Python 3.12 is already installed:
  python3.12 --version

  # If missing, install via Homebrew (on Intel Macs, prefer `uv` below if Homebrew falls back to compiling from source):
  brew install python@3.12
  ```

- **Linux (second developer):**

  ```bash
  # Ubuntu / Debian (24.04+ ships 3.12; on 22.04/older, add deadsnakes first: sudo add-apt-repository ppa:deadsnakes/ppa)
  sudo apt update
  sudo apt install -y python3.12 python3.12-venv python3.12-dev build-essential

  # Fedora / RHEL:
  # sudo dnf install -y python3.12 python3.12-devel gcc gcc-c++

  # Arch Linux (prefer `uv` or pyenv if repos only ship newer Python):
  # sudo pacman -S --needed base-devel
  ```

  *(Including `python3.12-venv`, `python3.12-dev`, and `build-essential`/`gcc` ensures `venv` creation works and any fallback source builds such as `cryptography` or `argon2-cffi-bindings` succeed on Linux.)*

#### Step 2 — Create `.venv`, install packages, and verify

**Option A — Standard `venv` + `pip` (macOS & Linux):**

```bash
python3.12 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
# Full setup (FastAPI decision service + offline ML/geospatial pipeline):
pip install -r apps/api/requirements.txt -r pipeline/requirements.txt
# Or API-only lightweight setup:
# pip install -r apps/api/requirements.txt pytest

python --version                 # Expected: Python 3.12.x
pytest -v apps/api/tests/test_scoring.py
```

**Option B — `uv` (recommended on Linux & Intel macOS; fetches Python 3.12 automatically without system packages):**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

uv venv .venv --python 3.12
source .venv/bin/activate

uv pip install -r apps/api/requirements.txt -r pipeline/requirements.txt
python --version
pytest -v apps/api/tests/test_scoring.py
```

> **Note:** `.venv/` is listed in `.gitignore` and must never be committed.

### 2. Web (`apps/web`) and Mobile (`apps/mobile`)

```bash
# Web (Next.js)
npm --prefix apps/web install
npm --prefix apps/web test
npm --prefix apps/web run dev

# Mobile (React Native / Expo SDK 58)
npm --prefix apps/mobile install
npm --prefix apps/mobile test
npm --prefix apps/mobile start
```

## Not included yet

- Supabase schema and row-level security policies.
