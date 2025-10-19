# Stripe Webhook Setup Guide - PRODUCTION

**Status:** REQUIRED for production
**Time Required:** 5 minutes

---

## Why You Need Webhooks

Webhooks allow Stripe to notify your server when important events happen (like successful payments, refunds, disputes). Without webhooks, your site won't automatically update order statuses.

---

## Step-by-Step Setup

### 1. Go to Stripe Dashboard

1. Open https://dashboard.stripe.com
2. **IMPORTANT:** Make sure you're in **LIVE mode** (toggle in top right should say "Viewing live data")

### 2. Navigate to Webhooks

1. Click **Developers** in the left sidebar
2. Click **Webhooks** tab
3. Click **Add endpoint** button

### 3. Configure Webhook Endpoint

**Endpoint URL:**
```
https://gemsutopia.ca/api/payments/stripe/webhook
```

**Description:** (optional)
```
Production webhook for order status updates
```

**Events to listen for:**
Click "Select events" and choose these 4 events:

- ✅ `payment_intent.succeeded` - Payment completed successfully
- ✅ `payment_intent.payment_failed` - Payment failed
- ✅ `charge.dispute.created` - Customer disputed a charge
- ✅ `charge.refunded` - Charge was refunded

**Latest API version:** Leave at default (uses your account's API version)

Click **Add endpoint**

### 4. Get Webhook Signing Secret

After creating the webhook, you'll see the endpoint details page.

1. Look for **Signing secret** section
2. Click **Reveal** to show the secret
3. Copy the secret (starts with `whsec_...`)

### 5. Update Environment Variable

**LOCAL (.env.local):**
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

**PRODUCTION (Vercel/Hosting):**
1. Go to your hosting dashboard (Vercel/Netlify/etc)
2. Go to Project Settings → Environment Variables
3. Update `STRIPE_WEBHOOK_SECRET` with the new value
4. Redeploy your app

---

## Testing the Webhook

### Option 1: Use Stripe CLI (Recommended for Development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook

# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

### Option 2: Test in Stripe Dashboard (Production)

1. Go to your webhook endpoint in Stripe Dashboard
2. Click **Send test webhook**
3. Select `payment_intent.succeeded`
4. Click **Send test webhook**
5. Check the **Response** tab to see if it was successful (should show `200 OK`)

---

## What Happens When Events Fire

### payment_intent.succeeded
- Your server updates the order status to "confirmed"
- Inventory is already decremented (happens during order creation)

### payment_intent.payment_failed
- Your server updates the order status to "failed"
- **Inventory is restored** (adds items back to stock)

### charge.dispute.created
- Your server updates the order status to "disputed"
- You'll need to respond to the dispute in Stripe Dashboard

### charge.refunded
- Your server updates the order status to "refunded"
- **Inventory is restored** (adds items back to stock)

---

## Verifying Webhook is Working

### In Stripe Dashboard:

1. Go to Developers → Webhooks
2. Click on your webhook endpoint
3. Check the **Attempts** tab
4. You should see successful attempts (200 status code) when events fire

### In Your Server Logs:

Look for these log messages when webhook fires:
```
Payment succeeded: pi_xxxxx
Order <order-id> confirmed via webhook
```

Or for failures:
```
Payment failed: pi_xxxxx
Order <order-id> marked as failed
```

---

## Troubleshooting

### Webhook Returns 400 "Invalid signature"

**Cause:** Wrong webhook secret in environment variables

**Fix:**
1. Double-check the `STRIPE_WEBHOOK_SECRET` in your production environment
2. Make sure you copied the secret from the **live mode** webhook (not test mode)
3. Redeploy your app after updating

### Webhook Returns 500 Error

**Cause:** Error in your webhook handler code

**Fix:**
1. Check your server logs for the actual error
2. Common issues:
   - Database connection issues
   - Missing environment variables (SUPABASE_SERVICE_ROLE_KEY)
   - Order not found in database

### Webhook Shows "Not Found" or 404

**Cause:** Route not deployed or incorrect URL

**Fix:**
1. Verify the URL is exactly: `https://gemsutopia.ca/api/payments/stripe/webhook`
2. Make sure your latest code is deployed
3. Test the endpoint manually: `curl https://gemsutopia.ca/api/payments/stripe/webhook`

---

## Security Notes

### Webhook Signature Verification

Your code already verifies webhook signatures using this line:
```typescript
event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
```

This ensures webhooks are actually from Stripe and haven't been tampered with.

### Never Skip Verification!

❌ Don't do this:
```typescript
// BAD - accepts webhooks from anyone!
const event = JSON.parse(body);
```

✅ Always verify:
```typescript
// GOOD - only accepts verified Stripe webhooks
event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
```

---

## Important Notes

1. **Different secrets for test vs live:**
   - Test mode webhook has a different `whsec_` secret
   - Live mode webhook has a different `whsec_` secret
   - Make sure you're using the LIVE secret in production!

2. **Webhook endpoint must be HTTPS:**
   - Stripe requires HTTPS for production webhooks
   - Your site is already HTTPS (gemsutopia.ca), so you're good ✅

3. **Retry logic:**
   - Stripe automatically retries failed webhooks
   - If your server returns 500, Stripe will retry up to 3 times
   - Check the webhook logs in Stripe Dashboard to see retry attempts

4. **Idempotency:**
   - Your webhook handler should be idempotent (safe to run multiple times)
   - Your code already handles this correctly by checking if order exists first

---

## Quick Checklist

Before going live, verify:

- [ ] Webhook endpoint created in **LIVE mode** (not test mode)
- [ ] Endpoint URL is `https://gemsutopia.ca/api/payments/stripe/webhook`
- [ ] All 4 events are selected:
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] charge.dispute.created
  - [ ] charge.refunded
- [ ] Webhook secret copied and saved
- [ ] `STRIPE_WEBHOOK_SECRET` updated in production environment
- [ ] Production app redeployed with new secret
- [ ] Test webhook sent successfully (200 OK response)

---

## After Setup

Once the webhook is set up:

1. **Place a test order** on your production site
2. **Check Stripe Dashboard** → Payments to see the payment
3. **Check Webhook logs** → Should show successful webhook delivery
4. **Check your database** → Order status should update to "confirmed"

That's it! Your payment system is now fully automated. 🎉
