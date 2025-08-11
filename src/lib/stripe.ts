import { loadStripe, Stripe as StripeType } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Client-side Stripe instance
let stripePromise: Promise<StripeType | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Price calculations
export const calculateOrderAmount = (items: Array<{price: number, quantity?: number}>) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const shipping = subtotal > 300 ? 0 : 15; // Free shipping over $300
  const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100; // 13% tax (HST in Canada)
  const total = subtotal + shipping + tax;
  
  return {
    subtotal: Math.round(subtotal * 100), // Stripe uses cents
    shipping: Math.round(shipping * 100),
    tax: Math.round(tax * 100),
    total: Math.round(total * 100)
  };
};

// Format Stripe amount (cents) to display price
export const formatAmount = (amount: number) => {
  return (amount / 100).toFixed(2);
};

export default stripe;