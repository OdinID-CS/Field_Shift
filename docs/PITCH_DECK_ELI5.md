# ScalarField (Field Shift) — 7-Slide Pitch Deck (Explain Like I'm 5)

> **Live Web & API Demo:** https://scalarfield.vercel.app/
> **Style:** Every single slide is written in simple, vivid **"Explain Like I'm 5"** language so anyone—from a farmer to a hackathon judge—gets it in seconds.

---

## Slide 1 — The Hook (Problem & Vision)

- **Title:**
  - **ScalarField** *(powered by Field Shift)*
  - **Tagline:** *Turning space pictures into simple crop-rotation plans farmers can actually trust.*
  - **Team Logo:** `[ Insert ScalarField / Field Shift Logo ]`
- **The Problem:**
  Imagine your garden has two rainy seasons and one super dusty, windy dry season (that's Ashanti, Ghana). If you plant the exact same hungry plant—**maize**—in the exact same dirt over and over:
  - The soil loses its food, bugs that love maize stay forever, and when the dusty Harmattan wind blows, the naked dirt washes away as soon as big storms return.
  - Even worse: **one big NASA satellite square (`9 km`) covers over `1,620` tiny farms at once!** Satellites speak "space math," not farmer language—so farmers are left guessing.
- **The Vision:**
  Weather is shifting fast. Giving farmers a simple, honest translator *right now* stops soil from washing away, saves money on expensive fertilizer, and keeps food growing without ever pretending a computer knows more than a local farm expert.

---

## Slide 2 — The Solution (The "Aha!" Moment)

- **Value Proposition:**
  ScalarField turns NASA satellite data and local farm wisdom into a plain-language **bare-dirt calendar** and **5-plan crop-rotation scoreboard** that works even without internet.
- **Core Innovation:**
  Instead of guessing what to plant next, ScalarField shows **when the dirt will be naked and thirsty**, compares **5 real ways to take turns planting crops** (like Maize + Cowpea, Groundnut, Mucuna, or Soybean), and lets the farmer slide *their own* priorities (water, soil health, money) to see which plan wins.
- **The "Magic":**
  - **Every single answer comes with a receipt ("Evidence Passport")** showing what space data was used, what is *still missing*, and whether a satellite pixel is too big for a small farm (**Scale Honesty**).
  - **No mystery AI:** 9 small, honest helpers (`M1–M9`)—including an **AI Advisor Chat** grounded in real math and an **offline phone camera check** that looks at dirt photos in Airplane Mode!

---

## Slide 3 — Product Demonstration (The Proof)

- **Visuals:**
  - `[ Insert Screenshot: Home Screen — Ashanti 5×5 km Grid Map & Soil Moisture Chart ]`
  - `[ Insert Screenshot: Calendar — 36-Dekad Exposure Calendar & Collapsible Bento Charts ]`
  - `[ Insert Screenshot: Compare Studio & Evidence Passport + AI Advisor Chat ]`
  - **Architecture Picture:**
    ```text
    NASA Satellites + Soil Maps  ──▶  9 Small Helpers (M1–M9)  ──▶  Supabase & Offline Phone Pack
                                                                             │
                     ┌───────────────────────────────────────────────────────┤
                     ▼                                                       ▼
        Web App (scalarfield.vercel.app)                        iOS Mobile App + SMS/Twi
    ```
- **User Flow (3 Easy Steps):**
  1. **Pick Your Spot & Check the Calendar:** Tap your `5×5 km` Ashanti neighborhood on the map and look at the **36-bucket calendar** to see which weeks the ground is bare, wet, or cloudy.
  2. **Slide Your Priorities & Stress-Test:** Tell the scoreboard what matters most (saving water, healing dirt, or income), test a *"Dry -20%"* or *"Heat +2°C"* weather shock, and see which of the **5 crop rotations** holds up best.
  3. **Check the Receipt & Snap a Photo:** Open the **Evidence Passport** (or ask the **AI Advisor Chat**), snap a plot photo offline with the phone camera to tag cover (`Intact` / `Partial` / `Bare`), and send a short **English or Twi** summary card!
- **Status (Fully Built & Working Now):**
  - Live Web App & API at **https://scalarfield.vercel.app/**
  - Native **iOS `.ipa` Mobile App** (Expo SDK 58) with offline district packs, 36-Dekad Calendar, Compare Studio, AI Advisor Chat, Scale Honesty checker, and offline Camera Plot Scan
  - Role-based Phone + 4-digit PIN demo logins (`Farmer`, `Extension Officer`, `Agronomist`) + English & Ashanti Twi SMS/USSD flows

---

## Slide 4 — Technical Stack & Feasibility

- **The Engine (Grouped Simply):**
  - **Frontend (What You Touch):** Next.js 16 + Tailwind CSS + MapLibre/Recharts (Web) and React Native / Expo SDK 58 + Skia (iOS Mobile).
  - **Backend & Storage (The Notebook):** FastAPI (`apps/api`) + Supabase (PostgreSQL + PostGIS + Row-Level Security) + Next.js `/api/chat`.
  - **Data & AI/ML Helpers (`M1–M9`):** Python geospatial pipeline (`scikit-learn`, `pymannkendall`, `pandas`) + OpenRouter LLM grounded by deterministic TypeScript/Python math.
- **Why This Tech:**
  We pre-compute heavy satellite math offline into JSON + Supabase and mirror the exact scoring math in TypeScript (`1e-9` parity)—so moving sliders on a farmer's phone takes **0 milliseconds** and works in **Airplane Mode**.
- **Scalability:**
  Because we use **global** NASA/partner datasets (never US-only maps) and keep heavy satellite work in offline batch jobs, adding a new region only needs a new config file (`pipeline/config/`), while thousands of users can read cached Supabase/phone data cheaply.

---

## Slide 5 — Market Viability & Business Model

- **Target Audience (Beachhead Market):**
  **Agricultural Extension Officers (MoFA), Farmer Cooperatives, and NGOs** supporting smallholder farmers in Ashanti, Ghana—who already visit farms with phones and need clear, trustworthy visual tools in English and Twi.
- **Monetization (How It Sustains Itself):**
  - **Freemium for Farmers:** Always free for individual farmers on mobile, web, and basic USSD/SMS.
  - **B2B / Institutional SaaS:** Annual subscriptions for agricultural ministries, cocoa/maize off-takers, agri-fintechs, and NGOs for officer dashboards, verified outcome tracking (`M8`), and regional climate-risk reports.
- **Go-To-Market (First 100 Users):**
  Partner with **3–5 Ashanti farmer cooperatives and local MoFA extension offices** for a 1-season field pilot—equipping extension officers with the offline iOS/Web app + Twi WhatsApp/SMS summary cards during pre-planting community meetings.

---

## Slide 6 — Future Roadmap (The Vision Beyond the Hack)

- **Next Steps (If We Had 3 More Weeks):**
  1. Connect **live automated NASA Earthdata / HLS cron refreshes** so the 36-dekad calendar updates every 10 days automatically.
  2. Collect real **officer-graded field outcomes** so `M8` (our careful learner) calibrates crop scores with Ashanti harvest data.
  3. Swap in a tiny **quantized on-device ML vision model (`.onnx`/`.tflite`)** inside `M9` for even sharper field-photo crop and pest detection.
- **Milestones:**
  - **Phase 1 — Built (Hackathon):** Full monorepo (`Web`, `iOS .ipa`, `FastAPI`, `Supabase`, `Python M1–M9`), offline mode, Twi SMS/USSD, and live demo at `scalarfield.vercel.app`.
  - **Phase 2 — Refinement (Weeks 1–4):** Field testing with Ashanti extension officers, CSIR-CRI agronomic review of rotation priors, and automated 10-day satellite ingest.
  - **Phase 3 — Launch (Months 2–3):** Regional rollout across Ashanti cooperatives, live M8 outcome calibration loop, and expansion to neighboring West African regions.

---

## Slide 7 — The Dream Team & Closing

- **The Team:**
  - **`kaliblip`** — *Mobile, ML & Data Pipeline Architect* (`apps/mobile` iOS app, Python `M1–M9` EO pipeline, `knowledge/` crop data, `apps/api` FastAPI, Supabase schema).
  - **`OdinID-CS`** — *Web, Maps & UX Architect* (`apps/web` Next.js platform, MapLibre & Recharts visualizations, Compare Studio, Evidence Passport, EN/Twi `next-intl` & PWA).
- **The Ask / Call to Action:**
  > **"Don't guess what to plant next—see the calendar, test the weather, and trust the receipt."**
  - **Test the Live Demo:** https://scalarfield.vercel.app/
  - **Quick Demo Login (`/login`):** Phone `0512345601` · PIN `1111` *(Farmer)* | `0512345602` · PIN `2222` *(Extension Officer)*
  - `[ Insert QR Code pointing to https://scalarfield.vercel.app/ ]`
