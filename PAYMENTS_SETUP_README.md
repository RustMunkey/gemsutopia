# 💎 Gemsutopia Payment Integration Setup Guide

This guide will walk you through setting up **Stripe**, **PayPal**, and **Coinbase Commerce** payment processing for your Gemsutopia gem store.

## 🚀 Overview

Your store now supports three payment methods:
- **💳 Stripe**: Credit/debit cards, Apple Pay, Google Pay
- **🟦 PayPal**: PayPal accounts and credit cards through PayPal
- **₿ Coinbase Commerce**: Bitcoin, Ethereum, and 100+ cryptocurrencies

## 📋 Prerequisites

- Gemsutopia application running
- Supabase database configured
- Domain name for production (webhooks require HTTPS)

---

## 1️⃣ Stripe Setup

### Step 1: Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification (for live payments)

### Step 2: Get API Keys
1. Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 3: Set up Webhooks
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

### Step 4: Add Environment Variables
Add to your `.env.local`:
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## 2️⃣ PayPal Setup

### Step 1: Create PayPal Business Account
1. Go to [PayPal Business](https://www.paypal.com/ca/business) and create account
2. Complete business verification

### Step 2: Create PayPal App
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/developer/applications/)
2. Click **Create App**
3. Choose **Default Application**
4. Select your business account
5. Check **Accept payments**
6. Copy your **Client ID**
7. Copy your **Client Secret**

### Step 3: Add Environment Variables
Add to your `.env.local`:
```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
```

---

## 3️⃣ Coinbase Commerce Setup

### Step 1: Create Coinbase Commerce Account
1. Go to [Coinbase Commerce](https://commerce.coinbase.com/) and sign up
2. Complete business verification

### Step 2: Get API Keys
1. Go to **Settings > API Keys** in your Coinbase Commerce dashboard
2. Click **Create an API Key**
3. Copy your **API Key**

### Step 3: Set up Webhooks
1. Go to **Settings > Webhook subscriptions**
2. Click **Add an endpoint**
3. Set endpoint URL: `https://yourdomain.com/api/webhooks/coinbase`
4. Select these events:
   - `charge:confirmed`
   - `charge:failed`
5. Copy the **Shared Secret**

### Step 4: Add Environment Variables
Add to your `.env.local`:
```env
# Coinbase Commerce Configuration
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key_here
COINBASE_COMMERCE_WEBHOOK_SECRET=your_coinbase_webhook_secret_here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 4️⃣ Database Setup

### Create Orders Table
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Run the SQL from `supabase_orders_table.sql`:

```sql
-- Create orders table for payments
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  items_count INTEGER NOT NULL DEFAULT 0,
  shipping_address JSONB,
  order_items JSONB, -- Store the actual items purchased
  metadata JSONB, -- Store payment provider metadata
  error_message TEXT, -- For failed payments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Add Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);
```

---

## 5️⃣ Testing

### Test Card Numbers

#### Stripe Test Cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`
- Use any future expiry date and any CVC

#### PayPal Testing:
- Use PayPal Sandbox accounts
- Create test accounts in [PayPal Developer Dashboard](https://developer.paypal.com/developer/accounts/)

#### Coinbase Testing:
- Use Coinbase Commerce test mode
- Test with small amounts of testnet cryptocurrencies

---

## 6️⃣ Production Checklist

### Before Going Live:

#### Stripe:
- [ ] Switch to live API keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real card (small amount)
- [ ] Enable live mode in Stripe Dashboard

#### PayPal:
- [ ] Switch to live API keys
- [ ] Update to production PayPal environment
- [ ] Test with real PayPal account

#### Coinbase Commerce:
- [ ] Switch to live mode
- [ ] Update webhook endpoint to production URL
- [ ] Test with real cryptocurrency (small amount)

#### General:
- [ ] Verify SSL certificate is working
- [ ] Test all payment methods end-to-end
- [ ] Verify order emails are working
- [ ] Check webhook endpoints are receiving data
- [ ] Monitor payment success rates

---

## 7️⃣ Environment Variables Summary

Your complete `.env.local` should include:

```env
# Existing Variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Coinbase Commerce Configuration
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_coinbase_webhook_secret
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 8️⃣ Features Included

### ✅ Stripe Integration
- Secure credit card processing
- Apple Pay & Google Pay support
- Real-time payment status
- Automatic receipt generation
- Failed payment handling
- Webhook confirmation

### ✅ PayPal Integration
- PayPal account payments
- Guest checkout with credit cards
- Mobile-optimized interface
- Automatic order fulfillment
- PayPal buyer protection

### ✅ Coinbase Commerce Integration
- 100+ supported cryptocurrencies
- Real-time crypto pricing
- Automatic confirmation
- Blockchain transaction tracking
- Expired payment handling

### ✅ General Features
- Canadian tax calculation (13% HST)
- Free shipping over $300
- Order management system
- Customer email notifications
- Failed payment retry
- Multiple payment method selection
- Mobile-responsive checkout

---

## 🆘 Troubleshooting

### Common Issues:

**Webhooks not working:**
- Ensure your domain has a valid SSL certificate
- Check webhook URLs are accessible from the internet
- Verify webhook secrets match your environment variables

**Payments failing:**
- Check API keys are correct and for the right environment
- Verify database connection is working
- Check browser console for JavaScript errors

**Orders not saving:**
- Verify Supabase connection
- Check the orders table was created correctly
- Ensure service role key has proper permissions

### Getting Help:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify webhook endpoints are receiving data
4. Test with small amounts first

---

## 🎉 You're Ready!

Your Gemsutopia store now supports:
- 💳 Credit/debit card payments
- 🟦 PayPal payments  
- ₿ Cryptocurrency payments

Customers can choose their preferred payment method during checkout, and all orders are automatically stored in your database with complete transaction details.

**Happy selling!** 💎