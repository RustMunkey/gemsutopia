# Changelog

All notable changes to Gemsutopia will be documented in this file.

---

## [2026-01-22] - Reviews Admin & Testimonials

### Admin Panel
- Added Reviews page with filter tabs (All, Pending, Approved, Featured)
- Approve/Reject/Feature/Unfeature/Delete actions for review screening
- Pending reviews alert when new submissions arrive
- Added Reviews link to sidebar navigation

### Homepage
- Testimonial cards: wider (580px) and shorter (2-line text clamp, tighter spacing)
- All 20 existing reviews set to featured

### Database
- Removed test reviews from "Asher"
- Created admin reviews API routes (GET/POST/PUT/DELETE) with cache invalidation + Pusher

---

## [2026-01-22] - FAQ Section

### Homepage
- Added FAQ section below Quality You Can Trust with centered title and HeroUI Accordion
- FAQ items fetched from database, only renders when content exists
- Real-time updates via Pusher `faq-updated` event

### Admin Panel
- Added FAQ CRUD section to Content page (title, add/edit/delete questions, reorder)
- Created `/api/faq` (GET/POST) and `/api/faq/[id]` (PUT/DELETE) admin API routes
- Cache invalidation and Pusher events on all mutations

### Database
- Seeded FAQ title ("Frequently Asked Questions") to site_content table
- Migration: `007_seed_faq_title.sql`

---

## [2026-01-22] - PRD Feature Implementation Pass

### Product Page
- Added "Write a Review" button that opens ReviewModal with productId
- Updated `/api/reviews` POST to save productId to reviews table
- Confirmed "Similar Products" section and breadcrumbs already working

### User Dashboard
- Created address management CRUD (`/api/user/addresses` GET/POST, `/api/user/addresses/[id]` PUT/DELETE)
- Created `UserAddresses.tsx` component with add/edit/delete/set-default functionality
- Added "Addresses" section to DashboardLayout navigation
- Addresses stored in user `preferences` JSONB column

### Checkout UX
- Added terms & conditions checkbox to PaymentMethods (links to ToS and Refund Policy)
- Added step progress indicator (numbered circles with connecting lines)
- Added "Save this address to my account" checkbox for logged-in users in CustomerInfo
- Continue button disabled until terms accepted

### Shop & Filtering
- Confirmed price range filter already implemented on category page
- Added sort preference persistence to localStorage
- Integrated EmptyState component on shop page (search-aware messaging)
- Added EmptySearchResults on category page when filters yield no results

### API Routes
- Confirmed `/api/loyalty/status` is fully implemented (returns "not configured" only when no tiers in DB)
- Confirmed `/api/connect` is a working utility/discovery endpoint

### User Dashboard (Continued)
- Rewrote DashboardOverview with real data (orders count, wishlist count, active bids from APIs)
- Welcome message with user's name, recent orders list (clickable links to /orders/[id])
- Created `/api/user/bids` endpoint (returns active bid count for overview stats)
- Created `/api/bids/user` endpoint (full bids list with auction details, stats, status)
- UserBids component already had full implementation (tabs, auction cards, bid actions)
- Implemented delete account: `/api/user/delete-account` (soft delete) + confirmation dialog in UserSettings

### Wishlist Sync
- Created `/api/wishlist` CRUD (GET/PUT/POST/DELETE) using wishlists + wishlist_items tables
- Updated WishlistContext: server sync for authenticated users with 1s debounce
- Merge on login: combines local + server items, syncs back any local-only items
- Falls back to localStorage for guests

### Checkout
- Added trust signals to PaymentMethods: SSL badge, 30-day guarantee, support contact
- Created `/checkout/cancel` page (PayPal cancel redirect destination)

### Auth
- Added password strength indicator to sign-up form (5-bar visual + label)

### Product Page
- Created `useRecentlyViewed` hook (localStorage-based, max 12 items)
- Added "Recently Viewed" section on product detail page (scrollable grid)

### Public Pages
- Created `/track` page for order tracking without login (order number + email)
- Timeline visualization, tracking number copy, carrier link

---

## [2026-01-22] - Comprehensive Audit & Dynamic Content

### PRD Document

Created comprehensive Product Requirements Document consolidating all project plans.

- **Created `PRD.md`** - 20-section document covering:
  - Executive summary with all critical issues
  - Cart and wishlist logic review
  - 80+ hardcoded content items needing CMS
  - Unimplemented UI features
  - API route issues (PayPal webhook missing)
  - User dashboard gaps
  - Desktop vs mobile inconsistencies
  - Admin panel architecture
  - Testing strategy
  - Priority implementation order

- **Deleted old plan files** from `.claude/plans/`:
  - admin-plan.txt, admin-ui.txt, checklist.txt
  - tests.txt, web-ui.txt, user-ui.txt

### Shipping System

Updated shipping calculation to be zone-based instead of currency-based.

- **Zone-Based Shipping** (`src/lib/utils/shipping.ts`)
  - Added `getShippingZone()` - Detects Canada vs USA from country name
  - Added `getZoneCurrency()` - Maps zone to native currency
  - Updated `calculateShipping()` - Uses destination country, not display currency
  - Canada destinations use CAD rates, USA uses USD rates
  - Combined shipping discount logic preserved

- **Checkout Updates** (`src/components/checkout/CheckoutFlow.tsx`)
  - Passes destination country to shipping calculation
  - Shipping recalculates when country changes

### Checkout UX

- **Added "Taxes included in price" notice** to:
  - CartReview order summary
  - Stripe payment form
  - PayPal payment form
  - Coinbase payment form

### Dynamic Homepage Content

- **Testimonials Section** (`src/app/page.tsx`)
  - Now fetches real reviews from `/api/reviews` endpoint
  - First tries featured reviews, then all approved reviews
  - Falls back to hardcoded testimonials only if database empty
  - Reviews from migrated database will now display

### Identified Critical Issues (from audit)

1. PayPal webhook endpoint missing
2. PayPal refunds not implemented
3. Newsletter signup is fake (TODO)
4. Homepage Featured section uses static mock data
5. Homepage Stats section hardcoded
6. User profile save doesn't work
7. Order details page (/orders/[id]) doesn't exist
8. Desktop UI needs polish for consistency with mobile

---

## [2026-01-19] - Admin Export System & CMS

### Export System

Added comprehensive data export functionality for admin panel with CSV, XLSX (Excel), and PDF support.

- **Export API Routes**
  - `GET /api/admin/export/orders` - Export orders with date range and status filters
  - `GET /api/admin/export/products` - Export product inventory with category/status filters
  - `GET /api/admin/export/customers` - Export customers with loyalty data and order history
  - `GET /api/admin/export/tax-report` - Tax reports with summary/detailed views, grouped by day/week/month/quarter/year

- **Export Utility** (`src/lib/utils/export.ts`)
  - `generateCSV()` - CSV generation
  - `generateXLSX()` - Excel generation via xlsx library
  - `generatePDF()` - PDF generation via jspdf + jspdf-autotable
  - `formatCurrency()`, `formatDate()`, `formatDateTime()` - Formatting helpers

### CMS Editor

Added TipTap-based rich text editor for CMS content management.

- **TipTap CMS Components** (`src/components/cms/`)
  - `RichTextEditor` - Full WYSIWYG editor with toolbar (bold, italic, headings, lists, alignment, links, images)
  - `RichTextRenderer` - Renders saved HTML content with proper styling
  - `ContentEditor` - Content editing wrapper with save/discard functionality

### New Dependencies

- `@tiptap/react`, `@tiptap/starter-kit` - Rich text editor core
- `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-text-align`, `@tiptap/extension-underline` - Editor extensions
- `xlsx` - Excel file generation
- `jspdf`, `jspdf-autotable` - PDF generation

---

## [2026-01-19] - Simplified Payment System

### Payment System Overhaul

Replaced custom crypto payment code with Coinbase Commerce for a simplified, hosted checkout experience.

### New Features

- **Coinbase Commerce integration** for cryptocurrency payments
  - `POST /api/payments/coinbase/create-charge` - Create Coinbase charge
  - `GET /api/payments/coinbase/verify-charge` - Verify charge status
  - `POST /api/payments/coinbase/webhook` - Handle Coinbase webhooks
  - Supports BTC, ETH, USDC, LTC, DOGE and more
  - Hosted checkout page (no custom UI needed)
  - Automatic order creation on payment confirmation

- **Enhanced CoinGecko API with Redis caching** (`src/app/api/crypto-prices/route.ts`)
  - 60-second Redis cache for crypto prices
  - Extended to include USDC, LTC, DOGE
  - Exchange rate calculation for CAD/USD

- **Updated CheckoutFlow** for Coinbase returns
  - Handles redirect back from Coinbase Commerce
  - Verifies payment status and creates order
  - Supports pending/confirmed states

### Removed (Simplification)

- **Removed Privy/Reown wallet integration** - Replaced by Coinbase Commerce
  - Deleted `src/contexts/WalletContext.tsx`
  - Deleted `src/contexts/PrivyContext.tsx`
  - Deleted `src/contexts/Web3Context.tsx`
  - Deleted `src/components/checkout/WalletPayment.tsx`

- **Simplified ClientLayout.tsx** - Removed unnecessary context providers
  - No longer wraps with Web3Provider, PrivyContextProvider, WalletProvider

### Updated Files

- `src/components/checkout/PaymentMethods.tsx` - Added Coinbase option
- `src/components/checkout/PaymentForm.tsx` - Added CoinbaseForm component
- `src/components/checkout/CheckoutFlow.tsx` - Coinbase return handling
- `src/app/ClientLayout.tsx` - Removed wallet providers
- `src/lib/cryptoPrices.ts` - Extended crypto support
- `src/lib/cache.ts` - Added CRYPTO_PRICES cache key

### New Environment Variables

```
COINBASE_COMMERCE_API_KEY       # Coinbase Commerce API key
COINBASE_COMMERCE_WEBHOOK_SECRET # Webhook signing secret
NEXT_PUBLIC_COINBASE_COMMERCE_ENABLED # Enable crypto payments (true/false)
```

### Payment Methods Available

| Method | Currencies | Type |
|--------|------------|------|
| Stripe | CAD, USD | Hosted Checkout |
| PayPal | CAD, USD | Smart Buttons |
| Coinbase | BTC, ETH, USDC, etc. | Hosted Checkout |

---

## [2026-01-19] - Medium Priority Security & Features

### Security Improvements

- **Migrated session management to Redis** (`src/lib/security/sessionManager.ts`)
  - Sessions now stored in Upstash Redis with automatic TTL expiration
  - Persists across serverless cold starts
  - Maintains session hijacking detection (IP/User-Agent checks)

- **Migrated 2FA to Redis with Resend email integration** (`src/lib/security/twoFactor.ts`)
  - 2FA codes stored in Redis with 10-minute TTL
  - Integrated with Resend for sending verification emails
  - Beautiful HTML email template for verification codes

- **Added security headers middleware** (`src/middleware.ts`)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy (camera, microphone, geolocation blocked)
  - Content-Security-Policy with Stripe, PayPal, Pusher allowed
  - Strict-Transport-Security (HSTS) in production

- **Fixed order ownership vulnerability** (`src/app/api/orders/[id]/route.ts`)
  - Users can only view their own orders (by userId or customerEmail)
  - Admins can view all orders
  - Guest access with matching email for order confirmation pages

- **Added DOMPurify-based input sanitization** (`src/lib/security/sanitize.ts`)
  - `sanitizeText()` - Removes ALL HTML tags (strict)
  - `sanitizeHTML()` - Allows basic formatting tags (reviews, comments)
  - `sanitizeAdminContent()` - Allows rich HTML for CMS content

### New Features

- **Cart sync to server for authenticated users**
  - `GET/POST/DELETE /api/cart` - Full cart operations
  - `POST/PATCH/DELETE /api/cart/items` - Individual item operations
  - `POST /api/cart/merge` - Merge guest cart on login
  - GemPouchContext updated with debounced server sync (500ms)
  - Automatic cart merge when user logs in
  - Sync status tracking (idle, syncing, synced, error)

- **RLS (Row Level Security) policies** (`database/migrations/005_rls_policies.sql`) ✅ **APPLIED**
  - RLS enabled on 13 tables: orders, carts, cart_items, wishlists, wishlist_items, payments, refund_requests, store_credits, notifications, bids, reviews, referrals, customer_loyalty
  - 48 policies created covering SELECT/INSERT/UPDATE/DELETE operations
  - Helper functions: `set_auth_context()`, `clear_auth_context()`, `current_user_id()`, `current_user_email()`, `is_current_admin()`
  - Database wrapper: `src/lib/db/withAuth.ts` for setting auth context per-request

- **Connect endpoint stub** (`src/app/api/connect/route.ts`)
  - `GET /api/connect` - Returns API status, version, and available endpoints
  - `POST /api/connect` - Acknowledges connection requests

### Dependencies

- Added `isomorphic-dompurify` ^2.35.0 for server-side HTML sanitization

### Files Created

- `src/app/api/cart/route.ts`
- `src/app/api/cart/items/route.ts`
- `src/app/api/cart/merge/route.ts`
- `src/app/api/connect/route.ts`
- `src/middleware.ts`
- `src/lib/db/withAuth.ts`
- `database/migrations/005_rls_policies.sql`

### Files Updated

- `src/lib/security/sessionManager.ts` - Redis migration
- `src/lib/security/twoFactor.ts` - Redis + Resend integration
- `src/lib/security/sanitize.ts` - DOMPurify functions
- `src/contexts/GemPouchContext.tsx` - Server sync
- `src/app/api/orders/[id]/route.ts` - Ownership check

---

## [2026-01-19] - WebSocket Real-time Updates with Pusher

### New Features

- **Pusher WebSocket integration for live updates**
  - Real-time bid notifications on auctions
  - Live auction end events
  - Inventory stock updates
  - Admin notifications for new orders and bids

### New Files

- **`src/lib/pusher.ts`** - Server-side Pusher utility
  - `triggerBidPlaced()` - Broadcast bid events to auction channels
  - `triggerAuctionEnded()` - Notify when auction ends (naturally or buy-now)
  - `triggerAuctionCreated()` - Announce new auctions
  - `triggerAuctionUpdated()` - Broadcast auction updates
  - `triggerStockUpdated()` - Inventory change notifications
  - `triggerOrderCreated()` - Admin new order alerts
  - Channel authentication for private channels

- **`src/lib/pusher-client.ts`** - Client-side Pusher hooks
  - `usePusherConnection()` - Track WebSocket connection status
  - `useChannel()` - Subscribe to Pusher channels
  - `useEvent()` - Listen for specific events
  - `useAuctionBids()` - Real-time bid updates
  - `useAuctionEnd()` - Auction end notifications
  - `useInventoryUpdates()` - Stock change alerts
  - `useAdminNotifications()` - Admin dashboard alerts

- **`src/app/api/pusher/auth/route.ts`** - Pusher channel authentication
  - Authenticates private channels (orders, admin)
  - Integrates with Better Auth for user verification

### Updated Files

- **`src/hooks/useRealtimeData.ts`** - Complete rewrite
  - Now uses Pusher WebSocket when available
  - Falls back to polling when Pusher not configured
  - `useRealtimeConnection()` - Exposes connection mode (websocket/polling)
  - All hooks automatically switch between modes

- **`src/components/RealtimeStatus.tsx`** - Updated status indicator
  - Shows "Live" (green) when WebSocket connected
  - Shows "Polling" (blue) when using fallback
  - Shows "Disconnected" (red) on connection failure

- **Auction routes with Pusher events**
  - `POST /api/auctions` - Triggers auction created event
  - `PUT /api/auctions/[id]` - Triggers auction updated/ended events
  - `POST /api/auctions/[id]/bid` - Triggers bid placed event
  - `POST /api/auctions/[id]/buy-now` - Triggers auction ended event

### Environment Variables Required

```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

---

## [2026-01-19] - Extended Redis Caching

### Additional Cached Endpoints

- **`/api/categories`** - Category list (10 min TTL)
- **`/api/categories/[id]`** - Single category (10 min TTL)
- **`/api/featured-products`** - Featured products (5 min TTL)
- **`/api/faq`** - FAQ items (30 min TTL)
- **`/api/gem-facts`** - Gem fact of the day (30 min TTL)
- **`/api/admin/dashboard-stats`** - Dashboard stats (2 min TTL)
- **`/api/auctions`** - Auction list (1 min TTL)
- **`/api/auctions/[id]`** - Single auction (1 min TTL)

### Cache Invalidation Added

- **Admin FAQ routes** - Invalidates FAQ cache on create/update/delete
- **Admin Gem Facts routes** - Invalidates gem facts cache on create/update/delete
- **Auction routes** - Invalidates auction caches on create/update/delete/bid

### Better Auth Redis Sessions

- **`src/lib/auth.ts`** - Added Redis secondary storage for sessions
  - Sessions cached in Redis for faster lookups
  - Falls back to database when Redis unavailable
  - 5-minute cookie cache for reduced DB hits

### Files Changed

- `src/lib/cache.ts` - Added more cache keys and TTLs
- `src/app/api/categories/route.ts` - Added caching
- `src/app/api/categories/[id]/route.ts` - Added caching + invalidation
- `src/app/api/featured-products/route.ts` - Added caching
- `src/app/api/faq/route.ts` - Added caching
- `src/app/api/gem-facts/route.ts` - Added caching
- `src/app/api/admin/dashboard-stats/route.ts` - Added caching
- `src/app/api/admin/faq/route.ts` - Added cache invalidation
- `src/app/api/admin/gem-facts/route.ts` - Added cache invalidation
- `src/app/api/auctions/route.ts` - Added caching + invalidation
- `src/app/api/auctions/[id]/route.ts` - Added caching + invalidation
- `src/app/api/auctions/[id]/bid/route.ts` - Added cache invalidation
- `src/app/api/auctions/[id]/buy-now/route.ts` - Added cache invalidation
- `src/lib/auth.ts` - Added Redis session storage

---

## [2026-01-19] - Redis Caching for Product Listings

### New Features

- **Created `src/lib/cache.ts` - Redis caching utility using Upstash**
  - `getCache<T>()` / `setCache()` - Type-safe cache operations
  - `generateCacheKey()` - Consistent key generation from params
  - `invalidatePattern()` - Pattern-based cache invalidation (uses SCAN)
  - `invalidateProductCaches()` - Invalidates all product-related caches
  - Falls back gracefully when Redis not configured

### Cached Endpoints

- **`/api/products`** - Product listing (5 min TTL)
  - Caches paginated results with filters (category, featured, onSale, sort)
  - Does NOT cache: admin requests (includeInactive), search queries

- **`/api/products/[id]`** - Single product (10 min TTL)
  - Caches individual product with category data

- **`/api/categories/[id]/products`** - Category products (5 min TTL)
  - Caches category product listings with pagination

### Cache Invalidation

- Automatic invalidation on product create/update/delete
- Single product changes invalidate: that product's cache + all list caches
- Pattern-based invalidation clears all matching keys

### Files Changed

- `src/lib/cache.ts` - NEW
- `src/app/api/products/route.ts` - Added caching
- `src/app/api/products/[id]/route.ts` - Added caching + invalidation
- `src/app/api/categories/[id]/products/route.ts` - Added caching

---

## [2026-01-19] - Database Migrations Executed

### Database Migrations Applied via Neon MCP

**Executed**: All pending migrations successfully applied to Neon PostgreSQL (project: long-hill-22917129)

- **`database/migrations/002_performance_indexes.sql`** ✅ APPLIED
  - 40+ performance indexes across all major tables
  - Products: is_active, category_id, featured, on_sale, gemstone_type, price, created_at
  - Orders: status, created_at, customer_email, user_id, payment_status
  - Auctions: is_active, end_time, status, active_ending composite
  - Bids: auction_id, user_id, bidder_email, created_at
  - Users, reviews, wishlists, cart_items, payments, categories, inventory_logs
  - Full-text search index on products (name, description, gemstone_type)
  - Uses `CONCURRENTLY` to avoid table locks during creation
  - Note: 4 indexes skipped (columns don't exist in current schema: reviews.is_approved, wishlists.product_id, cart_items.user_id/session_id)

- **`database/migrations/003_order_transactions.sql`** ✅ APPLIED
  - `create_order_atomic()` - Atomic order creation with row-level locks (`FOR UPDATE`)
    - Prevents overselling by checking and decrementing inventory in single transaction
    - Returns insufficient_items array if stock unavailable
    - Logs all inventory changes to inventory_logs table
  - `reserve_inventory()` - Checkout inventory reservation with `FOR UPDATE NOWAIT`
    - Fails fast on concurrent modification (doesn't wait for locks)
  - `restore_inventory()` - Inventory restoration for refunds/cancellations
    - Restores stock and logs the restoration

- **`database/migrations/004_dashboard_stats_functions.sql`** ✅ APPLIED
  - `get_dashboard_stats()` - Single-query stats with conditional aggregation
  - `get_product_stats()` - Product counts, low stock info
  - `get_top_selling_products()` - Best sellers by purchase_count
  - `get_recent_orders()` - Recent orders with live/dev mode filtering
  - `get_full_dashboard_stats()` - Combined function returning all dashboard data

### API Optimizations

- **`/api/products` - Added pagination and database-level filtering**
  - New params: `page`, `limit`, `sortBy`, `sortOrder`, `search`
  - Filters moved from JavaScript to SQL (much faster for large catalogs)
  - Returns pagination metadata: `{ page, limit, totalCount, totalPages, hasNextPage, hasPrevPage }`
  - Backwards compatible with `count` field

- **`/api/categories/[id]/products` - Optimized with efficient COUNT**
  - Replaced inefficient "fetch all to count" with proper SQL COUNT query
  - Added `sortBy` and `sortOrder` params
  - Added `hasNextPage` and `hasPrevPage` to pagination response

- **`/api/admin/dashboard-stats` - Now uses database functions**
  - Calls `get_full_dashboard_stats()` instead of fetching all orders
  - Single database call returns all metrics (was ~10 queries before)
  - Supports `mode` param for live/dev filtering
  - Falls back gracefully if functions don't exist yet

### Drizzle Schema Updates

- **Added missing tables to `src/lib/db/schema/tables.ts`**
  - `reviewVotes` - Track helpful/not helpful votes on reviews
  - `abandonedCartEmails` - Track abandoned cart email campaigns
  - Both tables had SQL schema but were missing from Drizzle

### Neon MCP Configuration

- **Fixed Neon MCP connection** - Was pointing to RocketMunkey org
  - Removed old config with `claude mcp remove neon`
  - Added correct config with API key for asher@neoengine.dev
  - Project ID: `long-hill-22917129` (Gemsutopia)

### Files Changed

- `database/migrations/002_performance_indexes.sql` - NEW
- `database/migrations/003_order_transactions.sql` - NEW
- `database/migrations/004_dashboard_stats_functions.sql` - NEW
- `src/app/api/products/route.ts` - Pagination & DB filtering
- `src/app/api/categories/[id]/products/route.ts` - Optimized COUNT
- `src/app/api/admin/dashboard-stats/route.ts` - Uses DB functions
- `src/lib/db/schema/tables.ts` - Added reviewVotes, abandonedCartEmails
- `plan.txt` - Updated Phase 2 progress, added URGENT migrations section
- `.claude/CLAUDE.md` - Added pending migrations documentation

---

## [2026-01-19] - Mobile UX & Review System

### Mobile Header Improvements

- **Accordion-style navigation for Shop/Auctions in mobile dropdown**
  - First tap expands submenu, second tap navigates to main page
  - Only one accordion open at a time (mutual exclusivity)
  - Background tap collapses open accordions without closing menu
  - Chevron icons point down (no animation)

- **Header button reorganization**
  - Currency toggle button replaces Sign Up when dropdown is open
  - Log In and Sign Up buttons added at bottom of dropdown above socials

- **Body scroll lock when mobile menu is open** - Prevents scrolling content behind dropdown

### Review Modal System

- **Created ReviewModal component** (`src/components/ReviewModal.tsx`)
  - Dark themed modal matching site design
  - Body scroll lock when modal is open
  - Integrated with `/api/reviews` endpoint
  - "Leave a Review" button on homepage opens modal

- **Star rating with @smastrom/react-rating**
  - Half-star support with touch/swipe interactions
  - Custom yellow star styling
  - Replaced custom implementation with proper library

- **Form improvements**
  - Email field moved to top (full-width, under stars)
  - Auto-growing textarea using `Textarea` component
  - Warmer subtitle: "We'd love to hear about your experience with us!"

### Cookie Banner Restyling

- Hero-style buttons (white primary, white/10 secondary)
- Mobile: centered full-width buttons
- Accept All at top, Show Details at bottom on mobile

### Mobile Global Fixes

- **Prevented iOS zoom on input focus** - All inputs/textareas/selects set to 16px on mobile
- **Black html/body background** - Consistent black background for overscroll areas
- **Horizontal swipe blocked** - `overscroll-behavior-x: none` prevents accidental horizontal scrolling
- **Pull-to-refresh enabled** - Vertical overscroll allowed for native refresh gesture

### Visual Fixes

- Featured section gradients narrower on mobile (w-4 instead of w-32)

### Dependencies

- Added `@smastrom/react-rating` ^1.5.0

---

## [2026-01-18] - Standardized API Response Format

### New Features

- **Created unified API response utilities** at `src/lib/api/`
  - `response.ts` - Core response functions and error codes
  - `index.ts` - Module exports

### API Response Format

All 59 API routes now use consistent response format:

```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: { message: string, code: string, details?: unknown } }
```

### Available Error Methods

- `ApiError.validation()` - 400 validation errors
- `ApiError.badRequest()` - 400 general bad requests
- `ApiError.unauthorized()` - 401 auth required
- `ApiError.forbidden()` - 403 access denied
- `ApiError.notFound()` - 404 resource not found
- `ApiError.conflict()` - 409 conflicts (e.g., duplicate entries)
- `ApiError.rateLimited()` - 429 too many requests
- `ApiError.internal()` - 500 server errors
- `ApiError.database()` - 500 database errors
- `ApiError.externalService()` - 502 external API failures

### Routes Updated (59 total)

- `/api/products/*` (4 files)
- `/api/orders/*` (3 files)
- `/api/categories/*` (3 files)
- `/api/auctions/*` (4 files)
- `/api/admin/*` (15 files)
- `/api/payments/*` (6 files - Stripe & PayPal)
- Utility routes: reviews, FAQ, stats, gem-facts, featured-products, discount-codes, site-content, upload, send-receipt, crypto-prices, site-info, shipping-settings, seo-metadata, pages, address-validation, address-suggestions, debug

### Excluded

- `/api/auth/[...all]` - BetterAuth managed route (has its own response format)

---

## [2026-01-18] - Error Handling System

### New Features

- **Complete error page system with all HTTP error codes**
  - Created `src/components/errors/ErrorPage.tsx` - Reusable error page component
  - Created `src/app/error/[code]/page.tsx` - Dynamic route for direct error page access
  - Supports error codes: 400, 401, 403, 404, 405, 408, 409, 410, 429, 500, 502, 503, 504
  - Each error has custom title and description

### Error Handling Wiring

- `src/app/not-found.tsx` - Shows 404 for dead routes (auto-triggered by Next.js)
- `src/app/error.tsx` - Catches runtime errors within layouts
- `src/app/global-error.tsx` - Catches root layout errors (standalone HTML/body)
- Error pages feature rotating gem logo background animation

### UI Design

- Error code displays in large Cormorant font (matches stats section)
- Contextual action buttons:
  - 401: "Log In" link to sign-in page
  - 403/404: "Go Back" button (window.history.back)
  - All others: "Try Again" button (page reload)
  - All pages: "Go Home" link
- Mobile: Full-width buttons (`w-[calc(100vw-4rem)]`)
- Desktop: Auto-width buttons with `whitespace-nowrap` to prevent text wrapping

### Dev Tools

- Added error page preview to `/dev/test-states` (skeletons, empty-states, loading tabs)

---

## [2026-01-18] - Email Notification System

### New Features

- **Complete email notification system with Resend**
  - Created modular email library at `src/lib/email/`
  - `templates.ts` - All HTML email templates
  - `send.ts` - Resend client wrapper with customer/admin helpers
  - `notifications.ts` - High-level notification functions
  - `index.ts` - Module exports

### Email Notifications Implemented

- **Order emails**: confirmation (customer + admin), shipped, cancelled, refund processed
- **Payment emails**: payment failed notification
- **Auction emails**: bid confirmation, outbid notification, auction won, auction lost
- **Contact emails**: form submission confirmation (customer + admin)

### API Routes Updated

- `/api/orders/route.ts` - Sends order confirmation on successful order
- `/api/orders/[id]/ship/route.ts` - NEW endpoint for shipping with tracking notification
- `/api/contact/route.ts` - Replaced inline email with notification system
- `/api/payments/stripe/webhook/route.ts` - Payment failed and refund notifications
- `/api/auctions/[id]/bid/route.ts` - Bid confirmation + outbid alerts
- `/api/auctions/[id]/buy-now/route.ts` - Auction won + previous bidder notification

### Templates Folder

- Created `templates/` folder with 12 customizable HTML email templates
- Includes README.md documenting all variables and usage
- Templates use Handlebars-style placeholders for easy customization

---

## [2026-01-18] - Console Log Cleanup

### Code Quality

- **Removed all 300+ console.log/error/warn statements from codebase**
  - Cleaned 50+ API route files
  - Cleaned all React components and contexts
  - Cleaned checkout and payment components
  - Cleaned proxy.ts middleware
  - Silent error handling - errors returned in API responses, not logged to console
  - Frontend toast notifications handle user-facing errors

---

## [2026-01-18] - Tax Removal & Simplified Pricing

### Business Logic

- **Removed all tax calculation logic**
  - Tax is now included in product prices
  - Customers pay: product price + shipping only
  - Removed `taxjar` dependency from package.json
  - Removed tax prop from all checkout components
  - Removed tax row from email receipts
  - Updated order totals to always set tax to 0

### Files Changed

- `CheckoutFlow.tsx` - Removed tax props and calculations
- `PaymentForm.tsx` - Removed tax from Stripe/PayPal/Wallet flows
- `WalletPayment.tsx` - Removed tax from crypto payment flow
- `OrderSuccess.tsx` - Removed tax display
- `CartReview.tsx` - Updated text: "Shipping calculated at next step"
- `/api/send-receipt/route.ts` - Removed tax from email template
- `/api/orders/route.ts` - Always stores tax as "0"

### Other

- Renamed `og-image.png` to `opengraph-image.png` for Next.js auto-detection

---

## [2026-01-18] - Production Readiness & Security Hardening

### Security

- **Added environment variable validation at startup**
  - Created `src/lib/env.ts` with required/optional var checks
  - Throws error in production if required vars missing
  - Logs warnings in development for optional vars
  - Type-safe env access via `env` export

- **Re-enabled rate limiting on admin login**
  - Integrated Upstash Redis for distributed rate limiting
  - 5 requests per 10 minutes with sliding window
  - In-memory fallback for development/local testing
  - Auto-clears on successful login

- **Removed IP allowlist feature entirely**
  - Deleted `src/lib/security/ipAllowlist.ts`
  - Removed from admin login route
  - Removed deprecated env vars from `.env.local`
  - Rate limiting provides sufficient protection

### Infrastructure

- **Prepared email infrastructure for Resend**
  - Updated `/api/send-receipt/route.ts` to use env vars
  - Updated `/api/contact/route.ts` to use env vars
  - Ready to activate when Resend API key is configured

- **Added Upstash Redis for serverless caching**
  - Installed `@upstash/redis` and `@upstash/ratelimit`
  - Created production-ready rate limiter at `src/lib/security/rateLimiter.ts`
  - Supports both async (Redis) and sync (memory) rate limit checks
  - Analytics enabled for monitoring

### Bug Fixes

- **Fixed Drizzle ORM field naming throughout codebase**
  - Converted snake_case to camelCase in OrdersManager.tsx
  - Converted snake_case to camelCase in Overview.tsx
  - Fixed Order interface types in orderUtils.ts
  - Made filter functions generic with proper type casting

- **Fixed icon imports**
  - Changed `IconDotsHorizontal` to `IconDots` in breadcrumb.tsx
  - Changed `IconOctagonX` to `IconCircleX` in sonner.tsx

- **Fixed database query helpers**
  - Updated Neon tagged template handling in db.ts
  - Fixed type casting in database.ts security module

- **Stubbed realtime components**
  - RealtimeDebugPanel.tsx now shows placeholder
  - RealtimeStatus.tsx shows "Polling" status

### Dependencies

- Added `@upstash/redis` ^1.34.3
- Added `@upstash/ratelimit` ^2.0.5
- Added `@types/three` for Three.js type declarations

---

## [2026-01-18] - Complete Database Migration to Drizzle ORM

### Major Changes

- **Fully migrated all database operations from Supabase client to Drizzle ORM**
  - Converted 40+ API routes to use Drizzle ORM with Neon PostgreSQL
  - Removed all Supabase database operations (keeping only Supabase Storage)
  - Authentication now uses Better Auth instead of Supabase Auth
  - Removed RealtimeContext (Supabase realtime subscriptions)

### API Routes Migrated

- All product, category, order, and review endpoints
- All admin dashboard endpoints (stats, FAQ, gem-facts, featured products, pages)
- Site content and settings management
- Authentication and verification endpoints
- Sitemap and SEO metadata generation

### Schema Additions

- Added `stats` table to Drizzle schema
- Added `siteContent` table to Drizzle schema
- Added `featuredProducts` table to Drizzle schema

### Security Improvements

- Fixed insecure JWT_SECRET fallback patterns across all API routes
- Moved all Supabase storage operations to server-side only
- Removed client-side Supabase imports from dashboard components
- Added dedicated API endpoint for storage file deletion (`/api/upload/delete`)

### Code Quality

- Removed `src/lib/supabase.ts` (deleted)
- Removed `AuthContext.tsx` Supabase auth (now uses Better Auth)
- Removed `RealtimeContext.tsx` (Supabase realtime no longer needed)
- Updated dashboard components to use API routes for uploads
- Consistent camelCase field naming in Drizzle with snake_case API responses

### Storage

- Supabase Storage retained for file uploads only (server-side)
- All file operations now go through `/api/upload` endpoint
- Client components no longer import `@supabase/supabase-js`

---

## [2026-01-18] - Security Fixes & Cleanup

### Security

- **Removed captcha system entirely** from admin login
  - Removed hCaptcha verification from API route
  - Removed captchaToken bypass from frontend
  - Simplified login flow (email + passcode only)

- **Fixed hardcoded JWT secret fallback**
  - Removed insecure default fallback in `src/app/api/admin/login/route.ts`
  - Removed insecure default fallback in `src/lib/auth/adminAuth.ts`
  - Now throws error if JWT_SECRET env var is not set

### Project Structure

- Created `.claude/` directory for Claude Code configuration
- Moved `CLAUDE.md` to `.claude/CLAUDE.md` with updated tech stack info
- Added `.claude/settings.json` with hooks for changelog reminders
- Consolidated `TODO.txt` into `plan.txt`
- Added Phase 6 (Codebase Restructuring) to plan

---

## [2026-01-18] - Database Migration & ORM Setup

### Database Migration

- **Migrated from Supabase to Neon PostgreSQL**
  - Migrated 31 products, 4 categories, 49 orders, 22 reviews
  - Migrated site_settings (21 entries), FAQ (5), gem_facts (17), discount_codes (1)
  - Handled schema differences with column mappings:
    - reviews: customer_name -> reviewer_name, customer_email -> reviewer_email
    - site_settings: setting_key -> key, setting_value -> value
    - gem_facts: fact -> content, gem_type -> gemstone_type
  - All data preserved, no data loss

### Drizzle ORM Setup

- Installed drizzle-orm, @neondatabase/serverless, drizzle-kit
- Created drizzle.config.ts for schema management
- Introspected full schema from Neon database (28 tables)
- Created type-safe schema at `src/lib/db/schema/tables.ts`
- Defined all foreign key relations at `src/lib/db/schema/relations.ts`
- Created database client at `src/lib/db.ts` with:
  - Drizzle ORM instance with full schema
  - Legacy query helpers for backward compatibility
  - Proper environment variable handling

---

## [2026-01-12] - Framework Modernization & Performance

### Framework Upgrades

- Upgraded from Next.js 15.4 to Next.js 16.1.1
- Upgraded from React 19.1 to React 19.2
- Migrated from npm to pnpm
- Enabled Turbopack as default bundler
- Renamed middleware.ts to proxy.ts for Next.js 16 compatibility

### Performance Optimizations

- Fixed N+1 query in products API (combined category lookup into single JOIN)
- Fixed N+1 inventory check in orders API (batch query instead of loop)
- Added caching headers to featured-products route (5 min ISR + 10 min stale-while-revalidate)
- Added caching headers to categories route (10 min cache for public list)
- Added useMemo/useCallback to GemPouchContext for cart performance
- Optimized RealtimeContext with lazy loading (only preloads products/categories)

### SEO & Web Standards

- Added dynamic SEO metadata from database (admin configurable)
- Added sitemap.ts with dynamic product/category pages
- Added robots.ts with proper crawl rules
- Added manifest.ts for PWA support
- Added JSON-LD structured data (Organization + Store schemas)
- Added font preloading and preconnect hints

### Bug Fixes

- Fixed admin stats CRUD (changed ID validation from numeric to UUID)
- Removed overly restrictive rate limiting from stats endpoint
- Fixed @web3icons/react import (TokenIcon -> TokenBTC, TokenETH, TokenSOL)
- Fixed Stripe API version (updated to 2025-08-27.basil)
- Fixed react-resizable-panels API change (PanelGroup -> Group)
- Fixed TypeScript issues with Supabase typed client in product routes
- Fixed lazy initialization for Stripe client (prevents build-time errors)
- Fixed categories API caching TypeScript type

### Code Quality

- Removed unused Database type imports where they caused issues
- Cleaned up empty newlines in imports
