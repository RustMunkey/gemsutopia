# Gemsutopia - Product Requirements Document

**Last Updated:** January 23, 2026

---

## Project Overview

**Gemsutopia** is a Canadian gemstone e-commerce platform built as a Next.js monorepo.

### Architecture
- **Monorepo** managed by Turborepo + pnpm workspaces
- `apps/web` - Customer-facing storefront (Next.js 16, port 3000)
- `apps/admin` - Admin dashboard (Next.js, port 3001)
- `packages/database` - Drizzle ORM schema + dual-driver client (Neon HTTP for prod, postgres.js for local)
- `packages/cache` - Upstash Redis wrapper (gracefully no-ops when Redis unavailable)

### Infrastructure
| Service | Production | Local Dev |
|---------|-----------|-----------|
| Database | Neon PostgreSQL (free tier, 5GB transfer/mo) | Docker PostgreSQL 17 (localhost:5432) |
| Cache | Upstash Redis (10k cmds/day free) | Docker Redis 7 (localhost:6379) - optional |
| Storage | Supabase Storage | Supabase Storage (same) |
| Payments | Stripe (live) + PayPal (live) + Coinbase | Stripe test keys + PayPal sandbox |
| Email | Resend (noreply@gemsutopia.ca) | Resend (same, or skip in dev) |
| Real-time | Pusher WebSocket | Pusher (same, or falls back to polling) |

### Database
- 44 tables (products, orders, auctions, users, categories, reviews, wishlists, carts, discount_codes, referrals, loyalty, etc.)
- 5 migration files applied + Drizzle schema push
- Row Level Security: 48 policies across 13 tables
- Atomic functions: `create_order_atomic`, `reserve_inventory`, `restore_inventory`

### Current State (Jan 23, 2026)
- Homepage: fully functional, pulls from DB (siteContent, stats, products, reviews, FAQ)
- Shop: functional but local DB has no product data yet (needs prod data copy)
- Admin: category/product/auction CRUD works, notifications functional
- Payments: Stripe + PayPal integrated and tested (were live in prod)
- Auth: Better Auth for users, JWT for admin - pages exist but untested end-to-end
- Local dev: Docker setup complete, dual-driver DB client working

---

## Critical (Blockers)

- [ ] ~80+ hardcoded content strings need CMS endpoints

---

## Hardcoded Content Needing CMS

### Homepage (`apps/web/src/app/page.tsx`)
- [ ] CTA text

### About Page
- [ ] Full about content, founder story, signature

### Terms of Service
- [ ] "gemsutopia@gmail.com" (2x)
- [ ] All 10 sections of terms

### Privacy Policy
- [ ] "Gemsutopia@gmail.com"
- [ ] All 11+ privacy sections

### Refund Policy
- [ ] "gemsutopia@gmail.com"
- [ ] 30-day guarantee, processing times

### Cookie Policy
- [ ] "gemsutopia@gmail.com"
- [ ] All 12 cookie policy sections

### Shipping Page
- [ ] Processing times, delivery estimates

### Returns Page
- [ ] Return period, instructions

### Support Page
- [ ] "gemsutopia@gmail.com"
- [ ] "24 hours" response time
- [ ] 4 FAQ items

### Product Page (`ProductContent.tsx`)
- [ ] Shipping info (processing, delivery)
- [ ] Default product specs
- [ ] Review count "(24)", "#1 Best Seller" badge

### Footer
- [ ] "© 2026 Gemsutopia"

### Header
- [ ] Social media URLs

---

## Unimplemented Features

### Newsletter Signup
- [ ] Send confirmation email (optional enhancement)

### Order Details Page
- [ ] Invoice download (future enhancement)

### User Profile
- [ ] Handle avatar upload (future enhancement)

### Two-Factor Authentication
- [ ] UI flow for setup (utilities exist in `lib/security/twoFactor.ts`)
- [ ] QR code generation
- [ ] Backup codes

### Invoice/Receipt Download
- [ ] PDF generation for orders
- [ ] Download button in UserOrders

---

## Wishlist Gaps

- [ ] No wishlist sharing
- [ ] No price change alerts

---

## Missing Empty States

- [ ] Some components available but not yet integrated: EmptyReviews, EmptyNotifications, EmptyTable, OfflineState, MaintenanceState

---

## User Dashboard Gaps

### Missing API Endpoints
- [ ] `POST /api/user/2fa/*` - 2FA setup

### Missing Features
- [ ] Loyalty system (database ready, no UI)
- [ ] Store credit (database ready, no UI)

---

## Desktop vs Mobile Inconsistencies

### Homepage
- [ ] Hero section scaling on large screens
- [ ] Featured products grid layout
- [ ] Stats section spacing
- [ ] About section layout
- [ ] Testimonials carousel behavior
- [ ] CTA sections sizing

### Shop Page
- [ ] Product grid columns (2 mobile → 3-4 desktop)
- [ ] Filter/sort controls positioning
- [ ] Category cards layout
- [ ] Search results display

### Product Detail
- [ ] Image gallery layout (vertical vs horizontal)
- [ ] Specs table width
- [ ] Add to cart button sizing
- [ ] Reviews section layout

### Checkout
- [ ] Form field widths
- [ ] Order summary positioning
- [ ] Payment method cards
- [ ] Success page layout

### User Dashboard
- [ ] Sidebar vs mobile accordion
- [ ] Table layouts on orders/bids
- [ ] Stats cards grid
- [ ] Profile form layout

### Header/Footer
- [ ] Navigation dropdown behavior
- [ ] Socials bar positioning
- [ ] Footer grid layout
- [ ] Newsletter form width

### General
- [ ] Ensure min/max widths on containers
- [ ] Check xl/2xl/3xl breakpoint handling
- [ ] Verify hover states work (not just touch)
- [ ] Test keyboard navigation

---

## UX Issues

### Checkout
- [ ] No express checkout (Apple Pay, Google Pay)

### Product Page
- [ ] No image zoom instructions for mobile

### Navigation
- [ ] Search doesn't have autocomplete

### Trust Signals
- [ ] Payment logos not shown until payment step

---

## E-Commerce Best Practices Gaps

- [ ] Back in Stock Notifications (email signup for sold-out items)
- [ ] Abandoned Cart Recovery (email sequence)
- [ ] Product Quick View (modal preview on shop grid)
- [ ] Wishlist Sharing
- [ ] Live Chat / Chatbot

---

## Storefront UI Remaining

### Auctions
- [ ] Filter by category
- [ ] "Watch this auction" button

### Auth Pages
- [ ] "Remember me" checkbox
- [ ] Social login buttons

---

## User Dashboard UI Remaining

### Orders
- [ ] Download invoice button

### Loyalty
- [ ] Current tier display
- [ ] Points balance
- [ ] Progress to next tier
- [ ] Tier benefits list
- [ ] Points history

### Store Credit
- [ ] Current balance
- [ ] Transaction history
- [ ] "How to earn" info

### Settings
- [ ] 2FA toggle

---

## Admin Panel UI

### Dashboard
- [ ] Stats cards with real data
- [ ] Revenue chart with real data
- [ ] Recent Orders list (real-time)
- [ ] Low Stock Alerts
- [ ] Quick Action buttons

### Products
- [ ] Product table with search/filters
- [ ] Bulk actions
- [ ] Add/Edit form with all fields
- [ ] Image/video upload
- [ ] Categories management
- [ ] Inventory log

### Orders
- [ ] Order list with filters
- [ ] Order detail view
- [ ] Status dropdown
- [ ] Tracking number input
- [ ] Send shipping email
- [ ] Process refund
- [ ] Export CSV/PDF

### Auctions
- [ ] Tabs: Active | Scheduled | Ended | Drafts
- [ ] Create/edit auction
- [ ] Live auction monitor
- [ ] End auction early button

### Customers
- [ ] Customer list with search
- [ ] Customer detail view
- [ ] Loyalty tier management
- [ ] Store credit management

### Content (CMS)
- [ ] Page list
- [ ] Rich text editor (TipTap)
- [ ] Image upload
- [ ] FAQ manager
- [ ] Gem facts manager
- [ ] Stats editor (for homepage stats)
- [ ] Featured products selector

### Marketing
- [ ] Discount codes CRUD
- [ ] Featured products drag-drop
- [ ] Banners

### Reports
- [ ] Sales reports with charts
- [ ] Order reports
- [ ] Product reports
- [ ] Tax reports for accountant
- [ ] Export CSV/PDF

### Settings
- [ ] Site name & logo
- [ ] Contact info
- [ ] Shipping methods
- [ ] Tax rates
- [ ] Social links
- [ ] Maintenance mode toggle

### Real-time
- [ ] New order notification
- [ ] New bid notification
- [ ] Low stock alert
- [ ] Multi-admin sync

---

## Testing

### Unit Tests
- [ ] Utility functions (formatCurrency, formatDate, etc.)
- [ ] Security functions (sanitize, hash, verify)
- [ ] Price calculations
- [ ] Export functions

### Module Tests
- [ ] Authentication flows
- [ ] Cart operations
- [ ] Checkout flow
- [ ] Payment processing
- [ ] Auction bidding

### E2E Tests (Playwright)
- [ ] Guest purchase flow
- [ ] Registered user purchase
- [ ] Auction bidding flow
- [ ] Admin product management
- [ ] Admin order management

### Payment Tests
- [ ] Stripe success/decline scenarios
- [ ] PayPal sandbox payments
- [ ] Coinbase charge flows
- [ ] Webhook processing

### Chaos Tests
- [ ] Database failures
- [ ] Redis failures
- [ ] API timeouts
- [ ] Concurrent operations
- [ ] High load

---

## Storage Migration

- [ ] Short-term: Keep Supabase Storage (it works)
- [ ] V2: Migrate to Vercel Blob or Cloudflare R2
- [ ] Update `packages/storage` to use new provider
- [ ] Migrate existing files
- [ ] Update all image URLs in database

---

## Medium Priority

- [ ] Many info pages have hardcoded fallback content
- [ ] Shipping times hardcoded in multiple places
- [ ] Email address hardcoded across site (gemsutopia@gmail.com appears 5+ times)

## Low Priority

- [ ] Some loading skeletons missing
- [ ] Loyalty program UI not built (database ready)
