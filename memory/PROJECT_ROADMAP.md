# MonthlyGrocery — Project Status, Gaps & Roadmap

> **Generated:** Sep 2026 (full monorepo scan)  
> **Audience:** Vaibhav / dev team  
> **Stack (actual):** Express + TypeScript + Supabase + `db.json` | React Native (customer + merchant) | Next.js 16 web-admin  
> **Note:** `memory/PRD.md` describes an older FastAPI/Mongo stack — treat **this file** as current-state truth for the Express monorepo.

---

## 1. Executive Summary

MonthlyGrocery is a **4-app monorepo** for a location-based monthly grocery marketplace:

| App | Port | Role |
|-----|------|------|
| `express-backend` | 8001 | REST API (`/api/*`) |
| `mobile-app` | 8081 | Customer shopping (React Native) |
| `merchant-app` | 8082 | Shopkeeper partner app |
| `web-admin` | 3000 | Super Admin control tower |

**Recently implemented (this sprint):**
- Area → shop order routing (`shopResolution`, `shopCatalog`)
- Strict location-aware catalog (with Supabase fallback when no `shop_products`)
- Web-admin Localities: shop assignment required, inline edit
- Pincode flow: save on area select, auto-fill address, validation, catalog APIs

**Biggest remaining risks:**
1. **Dual storage** — orders split between `db.json` and Supabase (drift, cancel gaps)
2. **Shop routing bypasses** — fuzzy pincode/area match, `shopId` fallback when no mapping
3. **Web-admin API split** — reads localhost, many writes hit hardcoded Vercel URL
4. **Customer can reach Shop without city/area** — returning users skip location onboarding
5. **No production OTP / payment / env config** — dev OTP `123456`, COD only

---

## 2. What's Done vs Partial vs Missing

### 2.1 Backend (`express-backend`)

| Area | Status | Notes |
|------|--------|-------|
| OTP auth (dev) | ✅ Done | `123456` bypass; Twilio stub |
| JWT + roles | ✅ Done | consumer / admin / super_admin |
| Products master catalog | ✅ Done | Supabase `products` |
| Location-aware catalog | ✅ Partial | Works when `city`+`area` sent; global fallback without location |
| `shopCatalog` service | ✅ Done | `shop_products` + Supabase fallback |
| Shop resolution | ✅ Partial | City+area first; fuzzy pincode/area; `shopId` passthrough |
| Checkout + shop assign | ✅ Done | Cart mismatch checks, `shop_name` in response |
| Coupons (checkout) | ✅ Done | Server validates discount |
| Delivery slots | ✅ Done | Local `db.json` capacity |
| Merchant orders API | ✅ Done | Filtered by `shop_id` |
| Addresses | ✅ Done | `db.json` only |
| Serviceable locations | ✅ Done | `db.json`; shop required on new zone |
| SKU approve → shop_products | ✅ Done | PNG required; `available: true` default |
| Subcategories | ✅ Done | Admin CRUD + mobile sidebar |
| Order cancel (consumer) | ⚠️ Partial | Fails if order only in Supabase |
| Platform orders admin | ⚠️ Partial | Reads `db.json` only |
| Server-side min order | ❌ Missing | `MIN_ORDER_LIMIT` in config only, not enforced |
| Server-side price verify | ❌ Missing | Client `total_amount` trusted |
| Stock check at checkout | ❌ Missing | |
| `GET /products/:id` | ❌ Missing | Mobile loads full catalog to find one product |
| Real OTP (Twilio) | ❌ Missing | |
| Single order source of truth | ❌ Missing | Split-brain design |

### 2.2 Customer App (`mobile-app`)

| Flow | Status | Notes |
|------|--------|-------|
| Onboarding (intro, city, area) | ✅ Done | Pincode saved on area select |
| Home / deals / categories | ✅ Done | Location + pincode on catalog APIs |
| Search | ✅ Done | Location-aware |
| Product detail | ✅ Done | |
| Cart | ✅ Done | Local AsyncStorage |
| Checkout (address, slot, coupon) | ✅ Done | |
| Payment (COD) | ✅ Done | Pincode validated vs area |
| Orders list / detail | ✅ Done | |
| One-click cart / copy last month | ✅ Done | Pincode on API |
| Saved baskets | ⚠️ Partial | Reconcile API missing `pincode` |
| Returning user → Shop | ❌ Gap | No city/area check on splash |
| Cart clear on area change | ❌ Gap | Stale `shop_id` in cart |
| Checkout location guard | ❌ Gap | Can checkout without area |
| GPS city detect | ❌ Stub | Alert only |
| Profile photo | ❌ Stub | |
| UPI / Card payment | ❌ Missing | |
| `MyCoupons` route | ❌ Bug | Wrong screen wired in navigator |
| Dead screens | 🗑️ | `ShopScreen.tsx`, `LandingScreen.tsx` unused |

### 2.3 Merchant App (`merchant-app`)

| Flow | Status | Notes |
|------|--------|-------|
| OTP login | ✅ Done | |
| Orders dashboard | ✅ Done | Status pipeline |
| Inventory (price/stock/available) | ✅ Done | |
| Master catalog + suggest SKU | ✅ Done | |
| Analytics | ✅ Done | From orders |
| Delivery slots config | ✅ Done | |
| Store settings | ⚠️ Partial | Hardcoded WhatsApp number |
| Push notifications | ❌ Missing | |

### 2.4 Web Admin (`web-admin`)

| Tab | Status | Notes |
|-----|--------|-------|
| Shops (approve/reject) | ✅ Done | |
| Localities (area → shop) | ✅ Partial | Inline shop edit; PIN not auto-filled from area pick |
| Cities & Areas | ✅ Partial | PIN field added; `has_locality_mapping` misleading |
| SKU requests | ✅ Done | Approve + PNG |
| Master catalog (list) | ✅ Done | localhost |
| Master catalog (create/delete) | ⚠️ Broken locally | Writes go to **Vercel** URL |
| Shop inventory modal | ✅ Done | Assign/unassign only |
| Banners, coupons, orders, analytics | ⚠️ Partial | Many calls hardcoded to Vercel |
| Single `page.tsx` (~4500 lines) | ⚠️ Tech debt | Hard to maintain |

---

## 3. Data & Admin Setup (Manual — Not Code)

These block correct routing even when code works:

| Task | Where | Why |
|------|-------|-----|
| Map every area → merchant shop | Web-admin → **Localities** | Orders route here |
| Set correct 6-digit PIN per area | Localities / Cities & Areas | Pincode validation + resolution |
| Merchant marks products **available** | Merchant app → Inventory | Catalog is empty if all `available: false` |
| Assign master SKUs to shop | Web-admin → Shop inventory OR merchant catalog | No `shop_products` = Supabase fallback only |
| Fix duplicate/wrong mappings in `db.json` | `express-backend/data/db.json` | Many Mumbai areas → one shop; Pune Baner → different shop |

**Current `db.json` pattern (example):**
- Mumbai areas → shop `e183b9e2...` (MonthlyGrocery) — often no `shop_products`
- Pune Baner → shop `4548b0b3...` (Thorat Wholesalers) — has SKUs but stock may be 0

---

## 4. Priority Roadmap

### Phase 0 — Critical Fixes (1–3 days)

**Goal:** Stop wrong orders and broken admin in local dev.

| # | Task | App | Effort |
|---|------|-----|--------|
| 0.1 | Gate `Shop` tab on `city` + `area` (splash, value intro, optional main tab guard) | mobile-app | S |
| 0.2 | Validate location before checkout / cart proceed | mobile-app | S |
| 0.3 | Clear or reconcile cart when user changes area | mobile-app | M |
| 0.4 | Remove `shopId` passthrough in `resolveShopIdForLocation` — require mapped location | backend | S |
| 0.5 | Require `city` + `area_name` at checkout; reject unmapped areas | backend | S |
| 0.6 | Unify web-admin API to **one** `NEXT_PUBLIC_API_URL` (remove Vercel hardcodes) | web-admin | M |
| 0.7 | Localities table: red badge when `shop_id` is null | web-admin | S |
| 0.8 | Auto-fill PIN in Localities form when area selected from dropdown | web-admin | S |
| 0.9 | Add `pincode` to `reconcileBasketItems` API + mobile | both | S |
| 0.10 | Fix `MyCoupons` navigator → correct screen | mobile-app | S |

**S = small (<4h), M = medium (4–8h)**

---

### Phase 1 — Routing & Catalog Hardening (3–5 days)

| # | Task | Details |
|---|------|---------|
| 1.1 | Tighten `shopResolution` | Remove pincode-only and area-only fuzzy match (or require city match) |
| 1.2 | Block global catalog | `GET /products/all` + `/search` without location → empty + `requires_location: true` |
| 1.3 | Remove Supabase catalog fallback OR gate behind `platform_shop` flag | `shopCatalog.ts` — merchants should curate via `shop_products` |
| 1.4 | `POST /areas` require valid PIN + warn if `shop_id` null | backend + web-admin |
| 1.5 | Distinguish "location exists" vs "shop assigned" in cities-areas UI | web-admin |
| 1.6 | `GET /products/:id` endpoint | backend + simplify `productDetailApi` |
| 1.7 | Pass `pincode` in `reconcile-basket` backend | `orders.ts` + `reconcileBasket.ts` |
| 1.8 | Fix `useCallback` deps for pincode (CopyLastMonth, OneClickCart) | mobile-app |

---

### Phase 2 — Orders & Data Integrity (5–7 days)

| # | Task | Details |
|---|------|---------|
| 2.1 | **Single order write path** — choose Supabase OR local as primary; sync all fields | Major refactor |
| 2.2 | Enforce `MIN_ORDER_LIMIT` server-side at checkout | `orders.ts` |
| 2.3 | Recompute `total_amount` from catalog prices server-side | `orders.ts` |
| 2.4 | Stock decrement / availability check at checkout | backend |
| 2.5 | Fix cancel for Supabase-only orders | `orders.ts` |
| 2.6 | Slot capacity includes Supabase order counts | `deliverySlots.ts` |
| 2.7 | Coupon usage counts from both stores | `orders.ts` |
| 2.8 | `writeDb` failure → return 500, don't silently continue | `localDb.ts` |

---

### Phase 3 — Production Readiness (1–2 weeks)

| # | Task | Details |
|---|------|---------|
| 3.1 | Env-based config | `DEV_MACHINE_IP`, `API_BASE`, JWT secret, Supabase keys — `.env` all apps |
| 3.2 | Real OTP (Twilio / MSG91) | `auth.ts` |
| 3.3 | Payment gateway (Razorpay / PhonePe) | mobile checkout + backend webhook |
| 3.4 | Image CDN (S3 / Cloudinary) — already partial via Supabase Storage | |
| 3.5 | WhatsApp order notifications | merchant + customer |
| 3.6 | Rate limiting on auth endpoints | |
| 3.7 | Sanitize search query `q` in products API | SQL injection style risk in Supabase filters |
| 3.8 | Split `web-admin/page.tsx` into tab components | maintainability |
| 3.9 | README at repo root with run instructions | replace placeholder |
| 3.10 | E2E tests (Detox / Maestro) for checkout happy path | |

---

### Phase 4 — Product Features (Backlog)

From `memory/PRD.md` + business needs:

| Feature | Priority | Notes |
|---------|----------|-------|
| Combo packs / bundles | P2 | |
| Referral program | P2 | |
| Invoice PDF / download | P2 | Config field exists, UI missing |
| Push notifications (order status) | P2 | |
| Merchant push on new order | P1 | |
| Platform analytics (real GMV from unified orders) | P2 | |
| Franchise onboarding flow | P2 | Tab exists in web-admin |
| Guest checkout without full onboarding | P3 | Conflicts with strict routing — decide product rule |
| Multi-language (Hindi UI) | P3 | |

---

## 5. Per-App Action Checklist

### express-backend
- [ ] Strict shop resolution (no client `shop_id` fallback)
- [ ] Checkout requires location + mapped shop
- [ ] Server-side price + min order validation
- [ ] Unified order storage
- [ ] `GET /products/:id`
- [ ] `reconcile-basket` accepts `pincode`
- [ ] Move `serviceable_locations` to Supabase (optional, for multi-instance)
- [ ] Real OTP + secrets from env

### mobile-app (customer)
- [ ] Returning users must have city/area/pincode
- [ ] Cart invalidation on area change
- [ ] Checkout location guard
- [ ] `savedBasketsApi` + reconcile pincode
- [ ] Fix MyCoupons route
- [ ] Remove dead screens or wire them
- [ ] `react-native-config` for API host
- [ ] Payment gateway UI

### merchant-app
- [ ] Env-based API URL
- [ ] Configurable support WhatsApp from backend
- [ ] New order notification
- [ ] Hide dev OTP hint in production builds

### web-admin
- [ ] Single API base via env
- [ ] Master catalog CRUD on same backend as list
- [ ] Localities UX: PIN auto-fill, unassigned shop warnings
- [ ] Shop inventory: edit price/stock inline
- [ ] Split monolithic `page.tsx`
- [ ] Dashboard: "X areas need shop assignment"

---

## 6. Architecture Diagram (Current)

```
Customer (mobile-app)
    │  city + area + pincode
    ▼
GET /api/products/all  ──► shopResolution ──► serviceable_locations (db.json)
    │                              │
    │                              └──► shop_id
    ▼
shopCatalog ──► shop_products (db.json) + products (Supabase)
    │
    ▼
Cart (local) ──► POST /api/orders/checkout
                      │
                      ├──► Supabase orders (thin)
                      └──► db.json orders (rich: OTP, slot, items)

Merchant (merchant-app)
    └──► GET /api/orders/merchant/all  (filter: shop_id)

Super Admin (web-admin)
    ├── Localities: area + PIN + shop_id  ──► serviceable_locations
    ├── Cities/Areas: taxonomy
    └── SKU approve ──► shop_products + Supabase product
```

---

## 7. Security & Dev-Only Items (Do Before Production)

| Item | Location | Risk |
|------|----------|------|
| OTP `123456` | `auth.ts` | Anyone can login |
| JWT default secret | `auth.ts`, `middleware/auth.ts` | Token forgery |
| `GET /products/master` public | `products.ts` | Full SKU list exposed |
| Hardcoded super-admin phone | seed / PRD | |
| `DEV_MACHINE_IP` in source | both mobile `api.ts` | |
| Vercel prod URL in web-admin writes | `page.tsx` | Accidental prod mutations |
| No HTTPS / cert pinning | mobile | MITM in prod |

---

## 8. Quick Wins (Do First Session)

1. **Super Admin data:** Open Localities → assign correct shop per area + verify PIN  
2. **Merchant:** Mark 10–20 products available with stock  
3. **Mobile:** Log out → select city/area → verify home shows products  
4. **Web-admin:** Set `NEXT_PUBLIC_API_URL=http://localhost:8001/api` and replace first 5 Vercel fetches  
5. **Backend:** One-line require `city`+`area` on checkout  

---

## 9. Suggested Sprint Plan (2 Weeks)

| Week | Focus | Deliverable |
|------|-------|-------------|
| **Week 1** | Phase 0 + data setup | Routing works end-to-end for 2 test areas (e.g. Pune Baner + Mumbai Andheri) |
| **Week 2** | Phase 1 + start Phase 2 | Strict catalog, no wrong-shop orders, web-admin unified API |

---

## 10. Files to Know (Key Paths)

```
express-backend/
  src/services/shopResolution.ts    # Area → shop
  src/services/shopCatalog.ts       # Shop inventory for catalog
  src/routes/orders.ts              # Checkout
  src/routes/products.ts            # Catalog APIs
  src/routes/adminControls.ts       # Localities, SKU, areas
  data/db.json                      # Local truth (locations, shop_products, orders)

mobile-app/
  src/context/AuthContext.tsx       # city, area, pincode
  src/utils/locationParams.ts       # Pincode helpers
  src/navigation/AppNavigator.tsx   # Routes (check MyCoupons)

web-admin/
  src/app/page.tsx                  # Entire admin UI
  src/utils/api.ts                  # API_BASE (localhost only)

merchant-app/
  src/screens/OrdersDashboard.tsx
  src/screens/MerchantInventoryScreen.tsx
```

---

## 11. Open Product Decisions (Need Your Call)

1. **Guest browsing without area** — Allow Pan-India catalog for discovery, or force area before any products?  
2. **Supabase fallback catalog** — Keep for platform default shop, or show empty until merchant lists inventory?  
3. **Pincode strictness** — Block checkout on PIN mismatch vs warn only? (Currently: **block**)  
4. **One shop per city vs per area** — Current model is per area; confirm for business.  
5. **Production hosting** — Vercel serverless + `db.json` **will not work** for multi-instance; need DB for locations/orders or single VM.

---

*Update this file when phases complete. For historical product vision see `memory/PRD.md`.*
