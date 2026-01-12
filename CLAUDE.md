# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start development server (8GB memory allocation)
npm run dev-turbo    # Start with Turbopack (faster, experimental)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 15.4 with App Router (React 19)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Styling**: Tailwind CSS v4
- **Payments**: Stripe, PayPal
- **Auth**: Supabase Auth (user auth) + JWT (admin auth)
- **Icons**: FontAwesome, Tabler Icons, Lucide React

## Architecture Overview

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (UI, checkout, dashboard, payments)
- `src/contexts/` - React context providers for global state
- `src/lib/` - Utilities, database helpers, security modules
- `src/hooks/` - Custom React hooks
- `middleware.ts` - Request middleware (rate limiting, security, admin auth)

### Context Providers (ClientLayout.tsx)
The app uses nested context providers in a specific order:
1. `ModeProvider` - Application mode state
2. `CookieProvider` - Cookie consent management
3. `AuthProvider` - Supabase user authentication
4. `RealtimeProvider` - Supabase real-time subscriptions for all tables
5. `CurrencyProvider` - Multi-currency support
6. `InventoryProvider` - Product inventory tracking
7. `WishlistProvider` - User wishlist management
8. `GemPouchProvider` - Shopping cart (called "Gem Pouch")
9. `WalletProvider` - Crypto wallet connections (Solana, Ethereum)
10. `NotificationProvider` - Toast notifications

### Real-time System
`RealtimeContext.tsx` provides site-wide Supabase real-time subscriptions for tables: auctions, products, categories, orders, users, bids, reviews, wishlists, cart_items, payments, shipping, inventory_logs, notifications. Includes optimistic updates with automatic rollback.

### Authentication
- **User Auth**: Supabase Auth via `AuthContext.tsx` (`useAuth()` hook)
- **Admin Auth**: JWT-based via `middleware.ts` and `src/lib/auth/adminAuth.ts`. Admin routes require valid token in cookie or Authorization header.

### Security
Located in `src/lib/security/`:
- `apiAuth.ts` - API authentication helpers
- `database.ts` - Database security utilities
- `rateLimiter.ts` - Rate limiting logic
- `sanitize.ts` - Input sanitization
- `sessionManager.ts` - Session handling
- `twoFactor.ts` - 2FA implementation

Middleware (`middleware.ts`) handles: rate limiting (200 req/min), XSS detection, SQL injection detection, attack tool blocking, and admin route protection.

### API Routes
- `/api/admin/*` - Protected admin endpoints (require JWT)
- `/api/payments/stripe/*` - Stripe payment processing
- `/api/payments/paypal/*` - PayPal integration
- `/api/products/`, `/api/categories/`, `/api/orders/` - CRUD operations
- `/api/auctions/` - Auction system with bidding

### Database
- Supabase client: `src/lib/supabase.ts` exports `supabase` (anon) and `supabaseAdmin` (service role)
- Database helpers: `src/lib/database/` (products, discountCodes, siteSettings)
- SQL migration files in root: `supabase-*.sql`

## Key Patterns

### Path Aliases
Use `@/*` for imports from `src/` directory (configured in tsconfig.json).

### Shopping Cart
The cart is called "Gem Pouch" throughout the codebase. Use `useGemPouch()` hook from `GemPouchContext`.

### Image Hosting
Images are stored in Supabase Storage at `odqcbgwakcysfluoinmn.supabase.co/storage/v1/object/public/`.

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
```
