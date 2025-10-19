# PayPal Integration Setup Guide

This guide will help you set up and test the PayPal payment integration for Gemsutopia.

## Prerequisites

1. A PayPal Business account (sign up at https://www.paypal.com/business)
2. PayPal REST API credentials
3. Access to PayPal Developer Dashboard

## Environment Variables

The following PayPal environment variables are required in your `.env.local` file:

```env
# PayPal API Credentials
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here

# Site Configuration
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Setup Steps

### 1. Get Your PayPal API Credentials

#### For Sandbox (Testing)

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Go to **Apps & Credentials**
3. Make sure you're in **Sandbox** mode (toggle at the top)
4. Under **REST API apps**, click **Create App** (or use the default app)
5. Enter an app name (e.g., "Gemsutopia Sandbox")
6. Click **Create App**
7. Copy your **Client ID** and **Secret**
8. Add them to your `.env.local` file

#### For Production (Live)

1. Switch to **Live** mode in the PayPal Developer Dashboard
2. Create a new app or use an existing one
3. Copy your **Live Client ID** and **Secret**
4. Update your production environment variables

### 2. Configure Your PayPal App

1. In your app settings, configure:
   - **Return URL**: `https://yourdomain.com/checkout/success`
   - **Cancel URL**: `https://yourdomain.com/checkout/cancel`
2. Enable the following features:
   - **Accept payments** - Required for checkout
   - **Refund payments** - For customer refunds

### 3. Test Accounts (Sandbox Only)

PayPal provides test accounts for sandbox testing:

1. Go to **Sandbox > Accounts** in the Developer Dashboard
2. You'll see two default accounts:
   - **Personal (Buyer)** - Use this to test purchases
   - **Business (Seller)** - Your merchant account
3. Click on a buyer account and note the email/password
4. Use these credentials when testing payments

## How It Works

### Checkout Flow

1. **Customer selects PayPal payment** → CheckoutFlow displays PayPal payment form
2. **Customer clicks PayPal button** → Creates a PayPal order via your API
3. **PayPal popup/redirect** → Customer logs in and approves payment
4. **Payment capture** → Your API captures the payment
5. **Order creation** → Your app creates the order in the database
6. **Success screen** → Customer sees order confirmation

### API Routes

- **Create Order**: `/api/payments/paypal/create-order`
  - Called when customer clicks the PayPal button
  - Creates a PayPal order with the total amount
  - Returns `orderID` to the PayPal SDK

- **Capture Order**: `/api/payments/paypal/capture-order`
  - Called after customer approves payment in PayPal
  - Captures the payment and finalizes the transaction
  - Returns capture details

## Testing

### Using Sandbox Test Accounts

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Add items to cart and proceed to checkout

3. Select PayPal as payment method

4. When the PayPal popup appears, use your sandbox buyer credentials:
   - Email: (from PayPal Developer Dashboard > Sandbox > Accounts)
   - Password: (from the same location)

5. Approve the payment in the PayPal interface

6. Verify the order is created successfully

### Creating Custom Test Accounts

1. Go to **Sandbox > Accounts** in Developer Dashboard
2. Click **Create Account**
3. Choose **Personal** (for buyers) or **Business** (for sellers)
4. Fill in the details and create the account
5. Use these credentials for testing

### Test Card Numbers (for PayPal Guest Checkout)

If testing without a PayPal account (guest checkout with card):

- **Visa**: 4032039975970927
- **Mastercard**: 5425233430109903
- **Amex**: 374245455400001

Expiry: Any future date
CVV: Any 3 digits (4 for Amex)

## Currency Support

PayPal supports multiple currencies. The integration automatically uses the currency selected by the customer:

- **CAD** - Canadian Dollar
- **USD** - US Dollar
- And 25+ other currencies

Make sure your PayPal account is configured to accept your desired currencies.

## Troubleshooting

### "Failed to create PayPal order" Error

**Check server logs** for detailed error information:
```bash
# Look for these in your terminal
PayPal create-order endpoint called
Request data: { amount, currency, items }
PayPal API Response Status: XXX
PayPal API Response Body: { ... }
```

**Common causes:**
1. **Invalid credentials** - Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
2. **Sandbox vs Live mismatch** - Ensure credentials match the mode (sandbox/live)
3. **Currency not supported** - Check your PayPal account currency settings
4. **API endpoint issue** - Verify you're using the correct base URL

### PayPal Button Not Appearing

1. Check that `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly
2. Verify the PayPal SDK is loading (check browser console)
3. Make sure you're not blocking third-party scripts
4. Try clearing browser cache

### Payment Capture Fails

1. Check that the PayPal order ID is valid
2. Verify the order hasn't already been captured
3. Ensure sufficient funds in test account (sandbox)
4. Check PayPal API logs in Developer Dashboard

### Order Created But Payment Not Captured

1. Check `/api/payments/paypal/capture-order` logs
2. Verify the `orderID` is being passed correctly
3. Check that `onApprove` callback is being triggered

## Error Messages

The integration now provides detailed error messages:

- **"Failed to initialize PayPal payment"** - Order creation failed
  - Check server logs for PayPal API response
  - Verify credentials and currency settings

- **"PayPal payment capture failed"** - Payment approval succeeded but capture failed
  - Check capture-order endpoint logs
  - Verify order hasn't been captured already

- **"Payment was cancelled"** - User closed PayPal popup
  - This is normal user behavior, no action needed

## Security Considerations

1. **Never expose your Client Secret** - Keep it server-side only
2. **Validate amounts server-side** - Don't trust client amounts
3. **Use HTTPS in production** - Required for secure transactions
4. **Store credentials securely** - Use environment variables
5. **Verify order IDs** - Ensure order IDs haven't been tampered with

## Switching to Production

Before going live:

1. **Get Live API credentials** from PayPal Developer Dashboard
2. **Update environment variables** with live credentials
3. **Change API base URL** in `create-order/route.ts`:
   ```typescript
   const PAYPAL_API_BASE = 'https://api.paypal.com'; // Remove 'sandbox'
   ```
4. **Test with small real transactions** first
5. **Enable live mode** in your PayPal Business account
6. **Set up webhooks** (optional, for advanced features):
   - Go to your live app settings
   - Add webhook URL: `https://yourdomain.com/api/payments/paypal/webhook`
   - Subscribe to relevant events

## Webhook Events (Optional Advanced Feature)

While not currently implemented, you can add webhook handlers for:

- `PAYMENT.CAPTURE.COMPLETED` - Payment successfully captured
- `PAYMENT.CAPTURE.DENIED` - Payment was denied
- `PAYMENT.CAPTURE.REFUNDED` - Payment was refunded
- `CUSTOMER.DISPUTE.CREATED` - Customer opened a dispute

## API Documentation

- PayPal REST API Docs: https://developer.paypal.com/api/rest/
- PayPal SDK Reference: https://developer.paypal.com/sdk/js/
- Orders API: https://developer.paypal.com/docs/api/orders/v2/
- Payments API: https://developer.paypal.com/docs/api/payments/

## Support

- PayPal Developer Support: https://developer.paypal.com/support/
- PayPal Community: https://community.paypal.com/
- Integration Support: https://www.paypal.com/us/business/contact-us

## Known Limitations

1. **No item breakdown** - Currently sends total amount only (simplified to avoid calculation mismatches)
2. **No webhooks** - Currently handles payment capture in real-time only
3. **Sandbox only** - Remember to switch to production URLs and credentials

## Recent Fixes

- **Removed tax calculation** that was causing order creation failures
- **Simplified order structure** to match frontend calculations exactly
- **Improved error logging** to show detailed PayPal API responses
- **Better error messages** displayed to users
