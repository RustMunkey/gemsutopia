'use client';
import { useState, useEffect } from 'react';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, CreditCard } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe publishable key:', publishableKey ? 'Found' : 'Missing');

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface PaymentFormProps {
  paymentMethod: 'stripe' | 'paypal';
  amount: number;
  customerData: any;
  items: any[];
  onSuccess: (data: { orderId: string }) => void;
  onError: (error: string) => void;
}

function StripeForm({ amount, customerData, items, onSuccess, onError }: Omit<PaymentFormProps, 'paymentMethod'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [stripeReady, setStripeReady] = useState(false);

  // Check if Stripe is ready
  useEffect(() => {
    console.log('Stripe instance:', stripe);
    console.log('Elements instance:', elements);
    setStripeReady(!!stripe && !!elements);
  }, [stripe, elements]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'cad' }),
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
  }, [amount, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setCardErrors({});

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      onError('Card element not found');
      setLoading(false);
      return;
    }

    // Create payment method
    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        address: {
          line1: customerData.address,
          line2: customerData.apartment || '',
          city: customerData.city,
          state: customerData.state,
          postal_code: customerData.zipCode,
          country: customerData.country === 'Canada' ? 'CA' : 'US',
        },
      },
    });

    if (paymentMethodError) {
      onError(paymentMethodError.message || 'Payment failed');
      setLoading(false);
      return;
    }

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id,
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      // Save order
      try {
        const orderData = {
          items,
          customerInfo: customerData,
          payment: {
            paymentIntentId: paymentIntent.id,
            paymentMethod: 'stripe',
            amount,
            currency: 'CAD'
          },
          totals: { total: amount },
          timestamp: new Date().toISOString()
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          const orderResult = await response.json();
          onSuccess({ orderId: orderResult.order.id });
        } else {
          onError('Payment processed but order save failed. Please contact support.');
        }
      } catch (error) {
        onError('Payment processed but order save failed. Please contact support.');
      }
    }

    setLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        padding: '12px 0',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  const handleCardElementChange = (elementType: string) => (event: any) => {
    if (event.error) {
      setCardErrors(prev => ({ ...prev, [elementType]: event.error.message }));
    } else {
      setCardErrors(prev => ({ ...prev, [elementType]: '' }));
    }
  };

  if (!stripePromise) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Payment system is not configured. Missing Stripe publishable key.</p>
        <p className="text-red-600 text-sm mt-2">Key status: {publishableKey ? 'Found' : 'Missing'}</p>
      </div>
    );
  }

  if (!stripeReady) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-gray-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-3"></div>
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="h-6 w-6 text-gray-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number *
          </label>
          <div className="p-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-black min-h-[50px] flex items-center">
            <CardNumberElement 
              options={cardElementOptions}
              onChange={handleCardElementChange('cardNumber')}
            />
          </div>
          {cardErrors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">{cardErrors.cardNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date *
            </label>
            <div className="p-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-black min-h-[50px] flex items-center">
              <CardExpiryElement 
                options={cardElementOptions}
                onChange={handleCardElementChange('cardExpiry')}
              />
            </div>
            {cardErrors.cardExpiry && (
              <p className="mt-1 text-sm text-red-600">{cardErrors.cardExpiry}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Code (CVC) *
            </label>
            <div className="p-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-black min-h-[50px] flex items-center">
              <CardCvcElement 
                options={cardElementOptions}
                onChange={handleCardElementChange('cardCvc')}
              />
            </div>
            {cardErrors.cardCvc && (
              <p className="mt-1 text-sm text-red-600">{cardErrors.cardCvc}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <Lock className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Your payment is secure</h4>
              <p className="text-sm text-gray-600">
                We use industry-standard encryption to protect your card information.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading || !clientSecret}
          className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing Payment...
            </div>
          ) : (
            `Complete Order - $${amount.toFixed(2)} CAD`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By completing your order, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  if (props.paymentMethod === 'stripe') {
    return (
      <Elements stripe={stripePromise}>
        <StripeForm {...props} />
      </Elements>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <p className="text-yellow-800">PayPal integration coming soon. Please use credit card payment.</p>
    </div>
  );
}