'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  items: Array<{ id: number; name: string; price: number; image: string; quantity?: number }>;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  onPaymentSuccess: (paymentIntent: {id: string; amount: number}) => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm = ({ items, customerInfo, onPaymentSuccess, onPaymentError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shipping = subtotal > 300 ? 0 : 15;
  const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(item => ({ 
              ...item, 
              quantity: item.quantity || 1 
            })),
            customerInfo,
          }),
        });

        const data = await response.json();

        if (data.error) {
          onPaymentError(data.error);
          return;
        }

        setClientSecret(data.clientSecret);
      } catch {
        onPaymentError('Failed to initialize payment');
      }
    };

    if (items.length > 0) {
      createPaymentIntent();
    }
  }, [items, customerInfo, onPaymentError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          address: {
            line1: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state,
            postal_code: customerInfo.zipCode,
            country: customerInfo.country === 'Canada' ? 'CA' : 'US',
          },
        },
      },
    });

    setLoading(false);

    if (error) {
      onPaymentError(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-5 w-5 text-black" />
        <h2 className="text-xl font-bold text-black">Payment Information</h2>
        <Lock className="h-4 w-4 text-green-600 ml-auto" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-300 rounded-lg p-4">
          <CardElement options={cardElementOptions} />
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (HST)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)} CAD</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading || !clientSecret}
          className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-neutral-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Complete Payment - ${total.toFixed(2)} CAD
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe • Your payment information is encrypted</span>
      </div>
    </div>
  );
};

const StripePaymentForm = (props: PaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;