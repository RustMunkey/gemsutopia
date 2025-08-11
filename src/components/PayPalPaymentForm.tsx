'use client';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface PayPalPaymentFormProps {
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
  onPaymentSuccess: (details: Record<string, unknown>) => void;
  onPaymentError: (error: string) => void;
}

const PayPalButtonWrapper = ({ items, customerInfo, onPaymentSuccess, onPaymentError }: PayPalPaymentFormProps) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [processing, setProcessing] = useState(false);

  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shipping = subtotal > 300 ? 0 : 15;
  const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100;
  const total = subtotal + shipping + tax;

  const createOrder = (data: Record<string, unknown>, actions: Record<string, unknown>) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "CAD",
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "CAD",
                value: subtotal.toFixed(2),
              },
              shipping: {
                currency_code: "CAD",
                value: shipping.toFixed(2),
              },
              tax_total: {
                currency_code: "CAD",
                value: tax.toFixed(2),
              },
            },
          },
          items: items.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: "CAD",
              value: item.price.toFixed(2),
            },
            quantity: (item.quantity || 1).toString(),
            category: "PHYSICAL_GOODS",
          })),
          shipping: {
            name: {
              full_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            },
            address: {
              address_line_1: customerInfo.address,
              admin_area_2: customerInfo.city,
              admin_area_1: customerInfo.state,
              postal_code: customerInfo.zipCode,
              country_code: customerInfo.country === 'Canada' ? 'CA' : 'US',
            },
          },
        },
      ],
      application_context: {
        shipping_preference: 'SET_PROVIDED_ADDRESS',
      },
    });
  };

  const onApprove = async (data: Record<string, unknown>, actions: Record<string, unknown>) => {
    setProcessing(true);
    try {
      const details = await actions.order.capture();
      
      // Store order in our database
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: details.id,
          details,
          customerInfo,
          items: items.map(item => ({ 
            ...item, 
            quantity: item.quantity || 1 
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      onPaymentSuccess(details);
    } catch {
      onPaymentError('PayPal payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const onError = (err: Record<string, unknown>) => {
    console.error('PayPal error:', err);
    onPaymentError('PayPal payment failed. Please try again.');
  };

  if (isPending) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-5 w-5 text-black" />
          <h2 className="text-xl font-bold text-black">PayPal Payment</h2>
          <Lock className="h-4 w-4 text-green-600 ml-auto" />
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-3">Loading PayPal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-5 w-5 text-black" />
        <h2 className="text-xl font-bold text-black">PayPal Payment</h2>
        <Lock className="h-4 w-4 text-green-600 ml-auto" />
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
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

      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        disabled={processing}
        style={{
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
        }}
      />

      {processing && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
          <span className="ml-2 text-sm">Processing payment...</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secured by PayPal • Your payment information is encrypted</span>
      </div>
    </div>
  );
};

const PayPalPaymentForm = (props: PayPalPaymentFormProps) => {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "CAD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtonWrapper {...props} />
    </PayPalScriptProvider>
  );
};

export default PayPalPaymentForm;