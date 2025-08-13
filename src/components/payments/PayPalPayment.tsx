'use client';
import { useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  onSuccess: (details: {captureID: string; status: string}) => void;
  onError: (error: string) => void;
  className?: string;
}

function PayPalButtonWrapper({
  amount,
  currency = 'USD',
  items = [],
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [loading, setLoading] = useState(false);

  const createOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, items }),
      });

      const data = await response.json();
      if (data.orderID) {
        return data.orderID;
      } else {
        throw new Error('Failed to create PayPal order');
      }
    } catch (error) {
      onError('Failed to initialize PayPal payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      const captureData = await response.json();
      if (captureData.success) {
        onSuccess(captureData);
      } else {
        onError('PayPal payment capture failed');
      }
    } catch (error) {
      onError('PayPal payment capture failed');
    } finally {
      setLoading(false);
    }
  };

  const onErrorHandler = (err: any) => {
    console.error('PayPal error:', err);
    onError('PayPal payment failed');
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
      }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onErrorHandler}
      onCancel={() => onError('Payment was cancelled')}
    />
  );
}

export default function PayPalPayment(props: PayPalPaymentProps) {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: props.currency || 'USD',
    intent: 'capture',
  };

  return (
    <div className={props.className}>
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtonWrapper {...props} />
      </PayPalScriptProvider>
    </div>
  );
}