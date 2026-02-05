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
  onSuccess: (details: { captureID: string; status: string }) => void;
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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const createOrder = async () => {
    // Prevent multiple simultaneous order creation attempts
    if (isCreatingOrder) {
      throw new Error('Order creation already in progress');
    }

    try {
      setIsCreatingOrder(true);

      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ amount, currency, items }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          } else {
            errorMessage += `: ${errorText}`;
          }
        } catch {
          errorMessage += `: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.orderID) {
        return data.orderID;
      } else {
        throw new Error('No orderID returned from server');
      }
    } catch (error) {
      onError(
        `Failed to initialize PayPal payment: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const captureData = await response.json();

      if (captureData.success) {
        onSuccess(captureData);
      } else {
        onError('PayPal payment capture failed');
      }
    } catch {
      onError('PayPal payment capture failed');
    }
  };

  const onErrorHandler = () => {
    onError('PayPal payment failed');
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
        <span className="ml-3 font-[family-name:var(--font-inter)] text-sm text-white/60">
          Loading PayPal...
        </span>
      </div>
    );
  }

  const paypalButtonStyle = {
    layout: 'vertical' as const,
    color: 'gold' as const,
    shape: 'rect' as const,
    label: 'paypal' as const,
    height: 50,
  };

  return (
    <PayPalButtons
      style={paypalButtonStyle}
      fundingSource={undefined} // Allow all funding sources including credit cards
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onErrorHandler}
      onCancel={() => onError('Payment was cancelled')}
      disabled={isCreatingOrder}
      forceReRender={[currency, amount]}
    />
  );
}

export default function PayPalPayment(props: PayPalPaymentProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId || clientId === 'your-paypal-client-id') {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="font-[family-name:var(--font-inter)] text-sm font-medium text-white/70">
          PayPal is not configured
        </p>
        <p className="mt-1 font-[family-name:var(--font-inter)] text-xs text-white/40">
          Contact support if this issue persists.
        </p>
      </div>
    );
  }

  const initialOptions = {
    clientId,
    currency: props.currency || 'USD',
    intent: 'capture',
    components: 'buttons,funding-eligibility',
    enableFunding: 'venmo,paylater,card',
    disableFunding: '',
    locale: 'en_US',
  };

  return (
    <div className={props.className}>
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtonWrapper {...props} />
      </PayPalScriptProvider>
    </div>
  );
}
