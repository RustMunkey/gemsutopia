# Gemsutopia Database

This folder contains all database-related files for the Gemsutopia e-commerce platform.

## Structure

```
database/
├── schema/          # Individual schema files (organized by domain)
│   ├── 000_extensions.sql
│   ├── 001_users.sql
│   ├── 002_categories.sql
│   ├── 003_products.sql
│   ├── 004_orders.sql
│   ├── 005_auctions.sql
│   ├── 006_reviews.sql
│   ├── 007_wishlists.sql
│   ├── 008_cart.sql
│   ├── 009_notifications.sql
│   ├── 010_content.sql
│   ├── 011_settings.sql
│   ├── 012_functions.sql
│   └── 013_views.sql
├── migrations/      # Timestamped migration files
├── seeds/          # Seed data for development/testing
└── functions/      # Stored procedures and functions
```

## Database Provider

This project uses **Neon** as the PostgreSQL database provider.

### Connection

Set the `DATABASE_URL` environment variable with your Neon connection string:

```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## Tables

The database includes the following tables:

### Core Tables

- **users** - User accounts and profiles
- **categories** - Product categories
- **products** - Product catalog with gemstone attributes
- **orders** - Customer orders
- **order_items** - Individual items in orders
- **payments** - Payment transactions

### Auction System

- **auctions** - Auction listings
- **bids** - Auction bids
- **auction_watchers** - Users watching auctions

### Customer Features

- **reviews** - Product reviews and ratings
- **wishlists** - User wishlists
- **wishlist_items** - Items in wishlists
- **carts** - Shopping carts
- **cart_items** - Items in carts
- **notifications** - User notifications
- **email_subscriptions** - Newsletter subscriptions

### CMS & Content

- **pages** - Static pages (About, Privacy, etc.)
- **faq** - FAQ entries
- **gem_facts** - Educational gemstone content
- **banners** - Homepage banners/sliders
- **contact_submissions** - Contact form submissions

### Configuration

- **site_settings** - Site configuration (key-value store)
- **discount_codes** - Promotional codes
- **discount_usage** - Discount code usage tracking
- **shipping_zones** - Shipping regions
- **shipping_methods** - Shipping options
- **tax_rates** - Tax configuration
- **inventory_logs** - Inventory change history

## Running Migrations

To apply all schema files to a fresh database:

```bash
# Using psql
psql $DATABASE_URL -f database/schema/000_extensions.sql
psql $DATABASE_URL -f database/schema/001_users.sql
# ... continue for all schema files

# Or use a migration tool like dbmate
```

## Neon Console

Manage your database at: https://console.neon.tech

Project ID: `orange-night-83359183`
