# MonthlyGrocery — Pan India Kirana Commerce

## Problem statement
Single-seller monthly grocery marketplace (min order ₹5,000) built for Indian households ordering pantry staples. Three roles: Consumer (mobile-first shopping), Admin (catalog/pricing ops), Super Admin (platform control tower + admin whitelisting).

## Tech stack
- FastAPI + MongoDB + Twilio Verify OTP + JWT (HttpOnly cookie)
- React 19 + Tailwind + Shadcn UI + Framer Motion + Recharts
- openpyxl / pandas for Excel bulk SKU import-export

## What's implemented (as of Feb 2026)
### Consumer (guest-first, Pan India)
- **Guest browsing** — `/shop`, `/products/:id`, `/cart` are public. NO OTP upfront. (Feb 2026)
- **Guest cart** via `localStorage["mg_guest_cart_v1"]`, hydrated via public `POST /api/cart/hydrate`.
- **Categories at top** of the Home page (`data-testid="top-categories"`), horizontally scrollable on mobile, 5×2 grid on desktop.
- **Pan India catalog** — city selection is optional (label "Delivering Pan India"); CitySelector has a first-class "Pan India" option.
- **OTP at checkout only** — `/checkout` renders a 2-step flow: (1) Mobile + OTP verify, (2) Address form.
- **Detailed address capture** — exact address, 6-digit PIN code (validated), nearest landmark (required), phone, delivery slot, special instructions.
- **Minimum order = ₹2,500** (reduced from ₹5,000 on 19 Feb 2026 for wider adoption).
- Instamart-style ADD → +/- stepper on product cards; sticky cart CTA on mobile.
- Bottom navigation persists across guest & authed sessions.

### Super Admin Home Banner Manager (Feb 2026)
- Full CRUD for hero-carousel banners under `/admin/banners`.
- Fields: title, subtitle, tag (kicker), icon (emoji), image_url (upload OR paste URL), gradient (5 presets), CTA label+URL, order, enabled toggle, schedule (start_at/end_at).
- Up/down reorder buttons persist via `POST /api/admin/banners/reorder`.
- Public feed `GET /api/banners/active` (in-schedule & enabled only, sorted by order) — consumed by the consumer Home carousel with a hard-coded default fallback when the list is empty.
- Every mutation logged to the admin activity log.

### Performance wins shipped Feb 2026
- Batch-fetched cart hydrate and checkout (removed N+1 patterns).
- Projected `/products/all` response (dropped description/video_url/images/search_keywords from list payloads; still returned on detail).
- New MongoDB indexes at startup: products(available), products(primary_category), products(available, primary_category), orders(created_at desc), orders(consumer_id, created_at desc), banners(enabled, order).

### Auth
- Twilio Verify OTP flow (mobile-only, no passwords). Consumer auto-approved. Admin waitlisted for Super Admin approval.
- Guest cart auto-merges into user cart via `POST /api/cart/merge` after successful OTP verify (additive on duplicates).

### Admin
- Excel bulk import/export of SKUs (openpyxl/pandas).
- City-scoped pricing dictionary per SKU (Mumbai/Pune/Bengaluru).
- Admin creation is **invite-only** — Super Admin whitelists mobile numbers.
- Admin Activity Log (audit trail: who added/edited/deleted which SKU, when).
- **Bulk SKU delete** (Feb 2026) — per-row checkbox + header select-all + destructive red bulk toolbar (`POST /api/products/mine/bulk-delete` with `{ids}`). A dedicated "Delete ALL SKUs" wipe requires typing "DELETE ALL"; both write dedicated audit entries.

### Super Admin
- Control Tower with Twilio SMS logs (every OTP + notification).
- Admin approvals dashboard (whitelist management).
- **Home Banner Manager** for the consumer hero carousel (create/edit/delete/reorder/schedule/enable).
- **View As toggle** (Feb 2026) — inside the sidebar role card. Preview the panel as Admin (hides super-only nav + shows "Viewing as Admin" chip) or as Customer (redirects to /shop with a floating "Viewing as Customer · Exit" pill). Choice persists in `localStorage["mg_view_as_v1"]` and is auto-cleared for non-super users.
- Only `+919833833498` (Shashank Mohore) pre-seeded.

### Notifications
- Twilio Welcome SMS on admin approval.
- Twilio order-confirmation SMS on `POST /api/orders/checkout`.

## Key API endpoints (recent additions in bold)
- `POST /api/auth/send-otp` / `POST /api/auth/verify-otp` — moved to checkout for consumers.
- **`POST /api/cart/hydrate`** — public; hydrates a guest cart line-item array.
- **`POST /api/cart/merge`** — auth; merges guest cart into user cart additively.
- `POST /api/orders/checkout` — now REQUIRES `address`, `landmark`, `pincode` (6-digit validated). Persists `landmark` in the order document.
- `GET /api/products/all` — no city param needed (Pan India default).

## Data model deltas
- `orders.landmark: str` (new, Feb 2026)
- `orders.pincode: str` (now 6-digit sanitized)

## Backlog (prioritised)
- **P1**: AWS S3 / Cloudinary object storage for product images (currently URL/base64).
- **P1**: WhatsApp order confirmations via Twilio.
- **P2**: Combo Packs ("Rasoi Starter" 15% off bundles).
- **P2**: Referral program ("Kisi ko invite karo, dono ko ₹500 off").
- **P2**: Payment gateway (currently COD only).
- **P2**: Phone-format validation at checkout (10-digit India check, currently accepts free-form).
- **P2**: DEV_OTP_BYPASS env flag for automated E2E testing of the checkout OTP flow.
- **P3**: Gate `GET /api/auth/me` on presence of session cookie to reduce noisy 401s in the guest console.

## Domain
- Production: `monthlygrocery.in`
- Preview: from `REACT_APP_BACKEND_URL`
