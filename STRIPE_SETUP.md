# Stripe Integration Setup Guide

This guide will help you set up and test the Stripe payment integration for Gemsutopia.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe API keys (found in your Stripe Dashboard)
3. Stripe CLI for local webhook testing (optional but recommended)

## Environment Variables

The following Stripe environment variables are required in your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL (for Stripe redirect)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Setup Steps

### 1. Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > API keys**
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the **Test mode** keys (they start with `pk_test_` and `sk_test_`)
5. For production, use **Live mode** keys

### 2. Set Up Webhooks

Stripe webhooks notify your application about events (successful payments, failed payments, disputes, refunds, etc.).

#### For Local Development (using Stripe CLI)

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to your Stripe account:
   ```bash
   stripe login
   ```
3. Forward webhook events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) from the CLI output
5. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

#### For Production Deployment

1. Go to **Developers > Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/payments/stripe/webhook`
4. Select the following events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
   - `charge.refunded`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add it to your production environment variables

### 3. Configure Redirect URLs

Make sure your `NEXT_PUBLIC_SITE_URL` environment variable is set correctly:

- **Local development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

This is used for Stripe Checkout success and cancel URLs.

## How It Works

### Checkout Flow

1. **Customer selects Stripe payment** → CheckoutFlow displays Stripe payment form
2. **Customer clicks "Continue to Stripe Checkout"** → Creates a Stripe Checkout Session
3. **Redirect to Stripe** → Customer completes payment on Stripe's secure page
4. **Return to your site** → Customer returns to `/checkout?session_id=...&payment_method=stripe`
5. **Order creation** → Your app verifies the payment and creates the order
6. **Success screen** → Customer sees order confirmation

### Webhook Events

Your webhook handler (`src/app/api/payments/stripe/webhook/route.ts`) processes these events:

- **`payment_intent.succeeded`**: Updates order status to "confirmed"
- **`payment_intent.payment_failed`**: Updates order status to "failed" and restores inventory
- **`charge.dispute.created`**: Updates order status to "disputed"
- **`charge.refunded`**: Updates order status to "refunded" and restores inventory

## Testing

### Test with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Testing Webhooks Locally

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the Stripe CLI listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
   ```

3. Complete a test checkout on your site

4. Watch the webhook events in your Stripe CLI terminal

5. Verify in your database that:
   - Order was created with status "pending"
   - Webhook updated order status to "confirmed"

### Testing Webhook Events Manually

You can trigger test webhook events using the Stripe CLI:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test dispute
stripe trigger charge.dispute.created
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check that your webhook endpoint is accessible
2. Verify the webhook secret matches your environment variable
3. Check Stripe Dashboard > Developers > Webhooks for failed events
4. Review webhook logs in Stripe Dashboard

### Payment Verification Fails

1. Check that `NEXT_PUBLIC_SITE_URL` is set correctly
2. Verify Stripe keys are correct (test vs live mode)
3. Check browser console for errors
4. Review server logs for API errors

### Order Not Created After Payment

1. Check browser console for errors during return from Stripe
2. Verify sessionStorage contains `stripeCheckoutData`
3. Check `/api/orders` endpoint logs
4. Verify Supabase connection and permissions

## Security Considerations

1. **Never expose your Secret Key** - Keep it server-side only
2. **Always verify webhook signatures** - Already implemented in webhook handler
3. **Use HTTPS in production** - Required for Stripe webhooks
4. **Store webhook secret securely** - Use environment variables, not code
5. **Validate payment amounts** - Already implemented in webhook handler

## Going Live

Before switching to production:

1. Replace test API keys with live keys
2. Update webhook endpoint in Stripe Dashboard
3. Test with real card in test environment
4. Enable live mode in Stripe Dashboard
5. Monitor webhook logs for issues

## API Routes

- **Create Checkout Session**: `/api/payments/stripe/create-checkout-session`
- **Verify Session**: `/api/payments/stripe/verify-session`
- **Webhook Handler**: `/api/payments/stripe/webhook`

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Stripe API Reference: https://stripe.com/docs/api
