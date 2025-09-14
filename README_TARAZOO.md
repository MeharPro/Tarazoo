# Tarazoo – Monorepo Overview

Tarazoo is a lightweight retail operations cockpit that connects product catalog management, demand forecasting, and purchase order design. It combines a Next.js storefront + merchant portal with small FastAPI services for forecasting and purchase-order design. Supabase is used where available; local JSON files provide an offline/demo mode.

## Highlights
- Shopper experience: barcode scanning, cart, checkout.
- Merchant portal: sales, inventory overrides, forecasting, PO design.
- Generative AI: Cohere Chat fallback for forecasting and assistant chat.
- Services: FastAPI microservices for Forecast and PO (Pyomo/heuristic).
- Resilience: Works with Supabase or local JSON for quick demos.

## Tech Stack
- Web app: Next.js (App Router), React 18, Tailwind, TypeScript.
- Data: Supabase client (`lib/supabase.ts`) + JSON under `backend/data`.
- Services: FastAPI (Python) – `services/forecast`, `services/po`, `services/minlp`.
- Build: pnpm + Next.js; Python via `uvicorn`.

## Directory Layout
- `app/` – Next.js routes (shop, dashboard, merchant tools, APIs)
  - `app/api/*` – App Router API endpoints (JSON)
  - `app/merchent/*` – Merchant catalog, inventory, forecasts, PO design
  - `app/merchant/[merchantId]` – Merchant dashboard wrapper
  - `app/dashboard` – Main dashboard with MINLP button
- `components/` – UI components (scanner, dashboards, navbar)
- `lib/` – Supabase client + helpers
- `services/` – FastAPI services
  - `services/forecast` – Forecasting (PyTorch MLP or naive fallback)
  - `services/po` – Purchase-order solve (Pyomo or heuristic fallback)
  - `services/minlp` – Demo MINLP optimizer + explanation
- `backend/data/` – JSON files for demo mode (catalog, inventory, sales, overrides, purchase_orders)
- `supabase/` – SQL schema, policies, and fixes

## Key User Flows
- Scanner → Cart → Checkout
  - Components: `components/camera-scanner.tsx`, cart context
  - API: creates orders in Supabase or updates local JSON
- Merchant Catalogue
  - Page: `app/merchent/catalog/page.tsx`
  - Inline editing for Name, Supplier, Country, Case Pack/MOQ, Sales, Expiration, and Demand(52w)
  - API: `app/api/merchent/catalog/route.ts`
- Forecasts
  - Page: `app/merchent/forecasts/page.tsx`
  - API Orchestration: `app/api/merchent/catalog/forecast/route.ts`
    - Try service (`FORECAST_BASE_URL`), fallback to Cohere (`COHERE_API_KEY`), then local average
  - Adjustments: `/api/assistant/adjust-forecast` and `/api/assistant/adjust-forecast/simple`
- Inventory Overrides
  - Page: `app/merchent/inventory/page.tsx`
  - APIs: `/api/inventory/overrides`, `/api/inventory/min-week`, `/api/inventory/decrement`
- Purchase Orders
  - Page: `app/merchent/purchase-orders/design/page.tsx`
  - Solve: `/api/po/solve` → `services/po`
  - PDF letter: `/api/po/letter`
- MINLP Optimization
  - Buttons on `app/dashboard/page.tsx` and `components/dashboard/DashboardClient.tsx`
  - Kicks off `/api/minlp/solve` and navigates to PO Design
  - Explanation: `/api/minlp/explain` → `services/minlp`

## Important API Routes
- Catalog: `GET/POST/DELETE /api/merchent/catalog`
- Forecast: `POST /api/merchent/catalog/forecast`
- Inventory: `GET/POST /api/inventory/overrides`, `GET/POST /api/inventory/min-week`, `POST /api/inventory/decrement`
- Orders/Sales: `GET /api/merchent/sales`, `GET/POST /api/merchent/orders`, `GET /api/merchent/inventory`
- PO: `POST /api/po/solve`, `POST /api/po/letter`, `GET/POST /api/po/notes`
- MINLP: `POST /api/minlp/solve`, `POST /api/minlp/explain`
- Assistant: `POST /api/assistant/chat`, `POST /api/assistant/adjust-forecast`, `POST /api/assistant/adjust-forecast/simple`
- Health: `GET /api/forecast/health`, `POST /api/revalidate`

## Environment Variables
Copy `.env.example` → `.env.local` and set:
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AI/Services: `COHERE_API_KEY`, `FORECAST_BASE_URL`, `PO_BASE_URL`, `MINLP_BASE_URL`
- Defaults/Flags: `NEXT_PUBLIC_MERCHANT_ID_DEFAULT`, `DEMO_MODE`, `ENABLE_PWA`, `ENABLE_EXPLAIN`

## Running Locally
1) Web app
```bash
pnpm install
pnpm dev
# http://localhost:3000
```

2) Forecast service (optional but recommended)
```bash
cd services/forecast
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

3) PO service
```bash
cd services/po
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn pyomo
uvicorn main:app --reload --port 8002
```

4) MINLP service (demo)
```bash
cd services/minlp
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set the related `*_BASE_URL` env vars in `.env.local` to match the ports above.

## Data Files (Demo Mode)
- `backend/data/catalog.json` – SKU list; 52w demand; optional forecasted_demand
- `backend/data/inventory.json` – starter inventory (if used)
- `backend/data/sales.json` – demo sales/orders
- `backend/data/overrides.json` – quantity overrides
- `backend/data/min-week.json` – min weeks of cover per SKU
- `backend/data/purchase_orders.json` – generated PO entries

## Deployment Notes
- Next.js app: Vercel recommended; add env vars via dashboard.
- Services: Deploy FastAPI services where convenient (Render/Fly/Cloud Run), update base URLs.
- Supabase: Run SQL from `supabase/migrations` and ensure RLS/policies match the demo settings.

## Security & Middleware
- `middleware.ts` protects `/merchant`, `/dashboard`, and `/merchent/*` routes.
- `DEMO_MODE=true` relaxes some auth checks for faster demos.

## Related Docs
- `README_DEMO.md` – 3–4 minute demo script and setup
- `supabase/migrations/*` – DB schema & policies

---
Built for quick iteration: edit inline, forecast on demand, design POs, and ship decisions.

