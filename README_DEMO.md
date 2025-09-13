# Tarazoo - Unified Commerce Platform Demo

## 🚀 Quick Start (36-Hour Hackathon Build)

### Overview
Tarazoo is a unified commerce platform combining:
- **Mobile Shopper App**: Barcode scanning, cart with 13% tax, checkout
- **Merchant Dashboard**: Live orders, sales metrics, MINLP optimization
- **Tech Stack**: Next.js, Supabase, FastAPI, Vercel

## 📱 Demo Features

### Shopper Experience (Mobile-First)
- **Camera Scanner**: Tap camera icon → scan product barcodes → auto-add to cart
- **Smart Cart**: Shows subtotal + 13% tax calculation
- **Quick Checkout**: Creates orders in Supabase with status tracking
- **PWA Support**: Install as mobile app for native-like experience

### Merchant Dashboard
- **Live Orders Feed**: Real-time order updates via Supabase
- **Sales Metrics**: Total revenue, average order value, today's orders
- **MINLP Optimization**: One-click supply chain optimization
- **Explanation Engine**: 3 bullets + TL;DR for optimization results

## 🛠 Setup Instructions

### 1. Supabase Setup
```bash
# Create a new Supabase project at https://supabase.com
# Run migrations in Supabase SQL editor:
# - /supabase/migrations/001_initial_schema.sql
# - /supabase/migrations/002_seed_data.sql
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Add your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run
```bash
# Install dependencies
pnpm install

# Run the Next.js app
pnpm dev

# In another terminal, run the MINLP service
cd services/minlp
pip install -r requirements.txt
python main.py
```

## 📋 Demo Script (3-4 minutes)

### Act 1: Shopper Journey
1. Open app on mobile (http://localhost:3000)
2. Tap camera icon in navbar
3. Scan barcode: `1234567890123` (Coffee)
4. Product auto-adds to cart with notification
5. Scan another: `2345678901234` (Chocolate)
6. Open cart → see subtotal + 13% tax
7. Checkout → order confirmed

### Act 2: Merchant Dashboard
1. Navigate to /dashboard
2. See new order appear instantly (realtime)
3. Review sales metrics cards
4. Click "Run MINLP Optimization"
5. View optimization results (cost, suppliers, lead time)
6. Click "Get Explanation" → see 3 bullets + TL;DR

### Act 3: Wrap Up
- "Unified UI for shoppers and merchants"
- "Realtime Supabase for instant updates"
- "FastAPI MINLP for supply chain optimization"
- "Deployed on Vercel with edge functions"

## 🧪 Test Barcodes

| Product | Barcode | Price |
|---------|---------|-------|
| Organic Coffee Beans | 1234567890123 | $24.99 |
| Premium Dark Chocolate | 2345678901234 | $8.99 |
| Artisan Sourdough Bread | 3456789012345 | $5.99 |
| Organic Almond Butter | 4567890123456 | $12.99 |
| Free Range Eggs | 5678901234567 | $7.99 |
| Greek Yogurt | 6789012345678 | $6.99 |
| Raw Honey | 7890123456789 | $14.99 |
| Extra Virgin Olive Oil | 8901234567890 | $18.99 |

## 🚢 Deployment

### Vercel Deployment
```bash
# Deploy Next.js app
vercel

# Deploy MINLP as Vercel Function
# Create /api/minlp endpoint that proxies to FastAPI
```

### Environment Variables (Production)
- Add all env vars from .env.local to Vercel dashboard
- Enable Supabase Realtime in project settings
- Set MINLP_BASE_URL to deployed function URL

## 📊 SLOs & Performance

- **Scan→Cart**: ≤ 2s P50
- **Checkout→Order**: ≤ 5s P95  
- **MINLP Run**: ≤ 10s
- **Explain**: ≤ 3s

## 🎯 Key Differentiators

1. **One Codebase**: Shopper + Merchant in same Next.js app
2. **Mobile-First**: Camera scanner with torch + fallback
3. **Realtime**: Orders appear instantly via Supabase
4. **Smart MINLP**: Optimizes supply chain with explanations
5. **PWA Ready**: Installable with offline support

## 🐛 Troubleshooting

### Camera Not Working?
- Check browser permissions for camera access
- Use manual barcode input as fallback
- Ensure HTTPS in production (required for getUserMedia)

### Orders Not Appearing?
- Verify Supabase Realtime is enabled
- Check RLS policies allow INSERT/SELECT
- Confirm merchant_id matches in dashboard

### MINLP Service Issues?
- Ensure FastAPI is running on port 8000
- Check CORS is enabled in main.py
- Verify MINLP_BASE_URL in .env.local

## 📝 Architecture Notes

```
/apps/web (Next.js)
  ├── app/
  │   ├── cart/ (with tax calculation)
  │   ├── checkout/ (Supabase order creation)
  │   └── dashboard/ (merchant portal)
  ├── components/
  │   ├── camera-scanner.tsx (@zxing/library)
  │   └── cart/supabase-cart-context.tsx
  └── lib/
      └── supabase.ts (client + operations)

/services/minlp (FastAPI)
  └── main.py (optimization + explanation)

/supabase/migrations/
  ├── 001_initial_schema.sql
  └── 002_seed_data.sql
```

## 🏆 Hackathon Impact

**Why This Wins:**
- **Visual Demo**: Barcode scanning is impressive live
- **Business Value**: Real supply chain optimization
- **Technical Depth**: Realtime, PWA, MINLP integration
- **Polish**: Unified UI, instant feedback, explanations
- **Scalable**: Ready for production with Vercel + Supabase

---

Built with ❤️ for the 36-hour hackathon challenge
