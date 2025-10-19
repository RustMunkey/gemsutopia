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
import { Lock, CreditCard, Wallet } from 'lucide-react';
import PayPalPayment from '../payments/PayPalPayment';
import WalletPayment from './WalletPayment';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe publishable key:', publishableKey ? 'Found' : 'Missing');

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface PaymentFormProps {
  paymentMethod: 'stripe' | 'paypal' | 'wallet';
  amount: number;
  customerData: any;
  items: any[];
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    amount: number;
    free_shipping: boolean;
  } | null;
  subtotal: number;
  tax: number;
  shipping: number;
  onSuccess: (data: { orderId: string; actualAmount?: number; cryptoAmount?: number; currency?: string; cryptoCurrency?: string; cryptoPrices?: any }) => void;
  onError: (error: string) => void;
}

function StripeForm({ amount, customerData, items, appliedDiscount, subtotal, tax, shipping, onSuccess, onError }: Omit<PaymentFormProps, 'paymentMethod'>) {
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);

    try {
      const currentCurrency = localStorage.getItem('currency') || 'CAD';

      const response = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currentCurrency.toLowerCase(),
          customerEmail: customerData.email,
          customerData,
          items,
          subtotal,
          shipping,
          tax,
          appliedDiscount,
          metadata: {
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            orderTimestamp: new Date().toISOString(),
          }
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Store checkout data for when user returns
        sessionStorage.setItem('stripeCheckoutData', JSON.stringify({
          customerData,
          items,
          subtotal,
          shipping,
          tax,
          appliedDiscount,
          amount,
          currency: currentCurrency,
        }));

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        onError('Failed to create checkout session');
        setLoading(false);
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      onError('Failed to initialize Stripe checkout');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="h-6 w-6 text-gray-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Stripe Payment</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Lock className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Secure Payment with Stripe</h4>
            <p className="text-sm text-blue-800">
              You'll be redirected to Stripe's secure checkout page to complete your payment with credit or debit card.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center text-lg font-semibold text-gray-900 mb-4">
          <span>Total Amount:</span>
          <span>${amount.toFixed(2)} {localStorage.getItem('currency') || 'CAD'}</span>
        </div>
      </div>

      <button
        onClick={handleStripeCheckout}
        disabled={loading}
        className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Redirecting to Stripe...
          </div>
        ) : (
          `Continue to Stripe Checkout`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By completing your order, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function PayPalForm({ amount, customerData, items, appliedDiscount, subtotal, tax, shipping, onSuccess, onError }: Omit<PaymentFormProps, 'paymentMethod'>) {
  const [loading, setLoading] = useState(false);

  const handlePayPalSuccess = async (details: {captureID: string; status: string}) => {
    try {
      setLoading(true);
      
      // Get current currency for PayPal order
      const currentCurrency = localStorage.getItem('currency') || 'CAD';
      
      const orderData = {
        items,
        customerInfo: customerData,
        payment: {
          captureID: details.captureID,
          paymentMethod: 'paypal',
          amount,
          currency: currentCurrency,
          status: details.status
        },
        totals: { 
          subtotal,
          discount: appliedDiscount?.amount || 0,
          tax,
          shipping,
          total: amount 
        },
        discountCode: appliedDiscount ? {
          code: appliedDiscount.code,
          type: appliedDiscount.type,
          value: appliedDiscount.value,
          amount: appliedDiscount.amount,
          free_shipping: appliedDiscount.free_shipping
        } : null,
        timestamp: new Date().toISOString()
      };

      console.log('Sending PayPal order data to API:', JSON.stringify(orderData, null, 2));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const orderResult = await response.json();
        onSuccess({ orderId: orderResult.order.id, actualAmount: amount, currency: currentCurrency });
      } else {
        const responseText = await response.text();
        console.error('Order save failed - Response status:', response.status);
        console.error('Order save failed - Response text:', responseText);
        
        let errorData = { error: 'Unknown error' };
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: `Server error (${response.status}): ${responseText}` };
        }
        
        console.error('Order save failed:', errorData);
        onError(`Payment processed but order save failed: ${errorData.error || 'Unknown error'}. Please contact support.`);
      }
    } catch (error) {
      onError('Payment processed but order save failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalError = (error: string) => {
    setLoading(false);
    onError(error);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Wallet className="h-6 w-6 text-yellow-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">PayPal Payment</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Wallet className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Pay with PayPal</h4>
            <p className="text-sm text-blue-800">
              You can pay with your PayPal account or use a credit/debit card through PayPal.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center text-lg font-semibold text-gray-900 mb-4">
          <span>Total Amount:</span>
          <span>${amount.toFixed(2)} {localStorage.getItem('currency') || 'CAD'}</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mr-3"></div>
            <p className="text-gray-600">Processing payment...</p>
          </div>
        ) : (
          <PayPalPayment
            amount={amount}
            currency={localStorage.getItem('currency') || 'CAD'}
            items={items.map(item => ({
              name: item.name || 'Gemstone',
              quantity: 1,
              price: item.price
            }))}
            onSuccess={handlePayPalSuccess}
            onError={handlePayPalError}
          />
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        By completing your order, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  if (props.paymentMethod === 'stripe') {
    return <StripeForm {...props} />;
  }

  if (props.paymentMethod === 'wallet') {
    return (
      <WalletPayment
        amount={props.amount}
        customerData={props.customerData}
        items={props.items}
        appliedDiscount={props.appliedDiscount}
        subtotal={props.subtotal}
        tax={props.tax}
        shipping={props.shipping}
        onSuccess={props.onSuccess}
        onError={props.onError}
      />
    );
  }

  // PayPal payment form
  return (
    <PayPalForm {...props} />
  );
}