'use client';
import { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error('Stripe publishable key is missing. Please check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.');
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface StripePaymentProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  className?: string;
}

function PaymentForm({ 
  amount, 
  currency = 'usd', 
  onSuccess, 
  onError 
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency }),
        });

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          onError('Failed to initialize payment');
        }
      } catch (error) {
        onError('Failed to initialize payment');
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }

    setLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#000000',
        backgroundColor: 'transparent',
        '::placeholder': {
          color: '#6b7280',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <label className="block text-black font-medium mb-3">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full py-3 px-4 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function StripePayment(props: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className={`${props.className} bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded`}>
        <strong>Payment Error:</strong> Stripe is not configured properly. Please contact support.
      </div>
    );
  }

  return (
    <div className={props.className}>
      <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
      </Elements>
    </div>
  );
}