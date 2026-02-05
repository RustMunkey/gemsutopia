# Gemsutopia - Remaining Work

## Quick Resume (Start Here)

**Last session:** January 23, 2026

**What was done:**
- Set up local Docker development (PostgreSQL 17 + Redis 7)
- Fixed database client to auto-detect Neon vs local PostgreSQL (dual-driver: `@neondatabase/serverless` for prod, `postgres.js` for local)
- Applied all migrations + `drizzle-kit push` to local DB (44 tables created)
- Removed fake placeholder data from shop page
- Enhanced admin category CRUD (description, image, edit mode)
- Built admin notifications API (real orders/messages/stock alerts)
- Fixed reviews page dark mode
- Added empty relation definitions for standalone tables (fixes `db.query` API)

**To resume development:**
```bash
docker compose up -d          # Start local PostgreSQL + Redis
pnpm dev                      # Start both web + admin dev servers
# Web: http://localhost:3000
# Admin: http://localhost:3001
```

**Immediate next steps:**
1. Copy production data to local DB (when Neon quota resets):
   ```bash
   pg_dump "<NEON_URL_FROM_ENV>" --data-only --no-owner --no-privileges | docker exec -i gemsutopia-db psql -U postgres -d gemsutopia
   ```
2. Seed local DB with test data if you don't want to wait for Neon reset
3. Verify admin panel CRUD -> frontend display pipeline works end-to-end
4. Fix remaining dark mode issues in admin content page

**Known issues:**
- Local DB has empty tables (no data copied from prod yet - Neon quota was exceeded)
- Admin content page still has ~90 hardcoded color instances (dark mode broken)
- Redis caching is disabled in local dev (app works fine without it - direct DB queries)

---

## Critical (Must-have for accepting money)

### 1. Authentication Flow
- [ ] Sign up / sign in pages fully wired with Better Auth
- [ ] Email verification working
- [ ] Password reset flow
- [ ] Session persistence across page reloads
- [ ] Google OAuth for admin panel

### 2. Checkout Completion (End-to-end verification)
- [ ] Cart -> Customer info -> Payment -> Order confirmation
- [ ] Stripe hosted checkout creates a real order in the DB
- [ ] PayPal capture creates a real order in the DB
- [ ] Order confirmation email sends via Resend
- [ ] Inventory decrements on successful payment
- [ ] Order number generation
- [ ] Receipt/confirmation page with order details

### 3. User Dashboard (Post-login experience)
- [ ] Order history (view past orders, status, tracking)
- [ ] Profile management (address, email, password change)
- [ ] Wishlist page
- [ ] Account settings
- [ ] Dashboard overview (recent orders, saved addresses)

### 4. Products/Categories CRUD (Admin creates -> shows on shop page)
- [ ] Category creation with image (API works, UI enhanced)
- [ ] Product creation with multiple images (API works, UI has single URL input)
- [ ] Verify web app `/api/categories` and `/api/products` serve admin-created data
- [ ] Product detail page pulls from DB correctly
- [ ] Category filtering works on shop page
- [ ] Sale price / on_sale flag displays correctly

### 5. Auctions System (Admin creates -> shows on auctions page)
- [ ] Auction creation from admin (API works)
- [ ] Bidding flow (place bid, validate minimum increment)
- [ ] Outbid notifications (email + in-app)
- [ ] Auction end logic (winner determination)
- [ ] Buy-now option processing
- [ ] Reserve price logic (no-sale if reserve not met)
- [ ] Auto-extend on last-minute bids
- [ ] Auction winner checkout flow

---

## Important (Should-have for launch)

### 6. Admin Panel Polish
- [ ] Orders page fetching real orders (API exists, verify wiring)
- [ ] Customers page listing real signups (API exists, deduplicate by email)
- [ ] Messages page fetching contact submissions (API exists)
- [ ] Messages: add mailto: reply button for quick email drafts
- [ ] Notifications bell functional (implemented - needs testing with live data)
- [ ] Dark mode fixes on content page (90 hardcoded color instances)
- [ ] Form draft persistence (localStorage-based)
- [ ] Navigation state persistence (remember last page)

### 7. Email Notifications
- [ ] Order confirmation to customer
- [ ] Shipping notification with tracking number
- [ ] New order alert to admin
- [ ] Contact form confirmation to customer
- [ ] Low stock alert to admin
- [ ] Auction outbid notification
- [ ] Auction won notification

### 8. Shipping/Tax Calculation
- [ ] Canadian shipping rates applied correctly at checkout
- [ ] Tax calculated based on province
- [ ] Free shipping threshold works
- [ ] Shipping method selection (standard/express)
- [ ] Carrier tracking URL generation

---

## Nice-to-have (Can launch without)

### 9. Discount Codes
- [ ] Admin creates codes with rules (percentage, fixed, free shipping)
- [ ] Customer applies at checkout
- [ ] Usage limits enforced
- [ ] Expiration dates respected

### 10. Referral System
- [ ] Generate unique referral codes per customer
- [ ] Track conversions
- [ ] Credit referrer on successful purchase
- [ ] Referral dashboard in user panel

### 11. Reviews
- [ ] Customer submits review on product page
- [ ] Admin approves/rejects in admin panel
- [ ] Approved reviews show on product detail page
- [ ] Featured reviews show on homepage

### 12. SEO
- [ ] Per-product meta title/description
- [ ] Per-category meta tags
- [ ] OpenGraph images
- [ ] Sitemap generation
- [ ] Structured data (JSON-LD for products)

### 13. Real-time Updates
- [ ] Pusher for live auction bids (polling fallback works)
- [ ] Inventory updates pushed to frontend
- [ ] Admin dashboard real-time order notifications

### 14. Redis Caching for Admin
- [ ] Form draft auto-save to localStorage
- [ ] Navigation state persistence
- [ ] Dashboard stats caching (reduce DB queries)

### 15. Loyalty Tiers
- [ ] Automatic tier upgrades based on lifetime spend
- [ ] Tier benefits applied at checkout
- [ ] Tier progress shown in user dashboard

### 16. Analytics/Reports
- [ ] Sales by period (daily/weekly/monthly)
- [ ] Revenue charts
- [ ] Popular products
- [ ] Customer acquisition metrics
- [ ] Conversion rate tracking

---

## Already Done

- Database schema (43 tables, fully migrated to Neon)
- All API routes (products, categories, auctions, orders, payments, contact)
- Payment integrations (Stripe, PayPal, Coinbase Commerce)
- Admin panel structure (all pages exist with CRUD)
- Homepage CMS (fully dynamic from database via siteContent table)
- Shop page (database-driven, fake placeholder data removed)
- Auctions page (database-driven, no fake data)
- Contact form (stores to DB + sends dual emails via Resend)
- Security (RLS policies, rate limiting, input sanitization, CSP headers)
- Real-time infrastructure (Pusher + polling fallback)
- Cart system ("Gem Pouch" with server sync + debounce)
- Static pages (About, Support, Privacy, Terms, Refund, Cookie, etc.)
- Footer, Header, responsive layout, mobile-optimized
- Dark mode (theme provider, most pages working)
- Admin: Products CRUD with category management
- Admin: Auctions CRUD with status management
- Admin: Orders list with status updates + tracking
- Admin: Customers list with email capability
- Admin: Messages inbox with reply via Resend
- Admin: Reviews moderation (approve/reject/feature)
- Admin: Homepage content editor (hero, stats, about, FAQ)
- Admin: Settings (shipping, payments, notifications, store config)
- Admin: Notification bell with real data (orders, messages, stock alerts)
- Multi-currency support (CAD/USD/EUR/GBP with crypto prices)
- Wishlist system with notifications
- Star ratings component (@smastrom/react-rating)

---

## Infrastructure Notes

- **Database**: Neon PostgreSQL (free tier: ~5GB transfer/month)
- **Redis**: Upstash (free tier: 10k commands/day, 500k/month)
- **Local dev**: Use Docker PostgreSQL + Redis to avoid hitting cloud limits
- **Production**: Consider Neon Pro ($19/mo) + Upstash Pro ($10/mo)
- Both reset monthly based on billing cycle start date
