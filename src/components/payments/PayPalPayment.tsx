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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const createOrder = async () => {
    // Prevent multiple simultaneous order creation attempts
    if (isCreatingOrder) {
      console.warn('Order creation already in progress, skipping...');
      throw new Error('Order creation already in progress');
    }

    try {
      setIsCreatingOrder(true);
      console.log('=== PayPal Order Creation Started ===');
      console.log('Request data:', { amount, currency, items });
      console.log('Frontend URL:', window.location.origin);
      
      const apiUrl = '/api/payments/paypal/create-order';
      console.log('Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ amount, currency, items }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Success Response:', data);
      
      if (data.orderID) {
        console.log('PayPal orderID received:', data.orderID);
        return data.orderID;
      } else {
        console.error('No orderID in response:', data);
        throw new Error('No orderID returned from server');
      }
    } catch (error) {
      console.error('=== PayPal Order Creation Failed ===');
      console.error('Error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      onError(`Failed to initialize PayPal payment: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsCreatingOrder(false);
      console.log('=== PayPal Order Creation Finished ===');
    }
  };

  const onApprove = async (data: any) => {
    try {
      console.log('PayPal payment approved:', data);
      
      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Capture failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const captureData = await response.json();
      console.log('PayPal payment captured:', captureData);
      
      if (captureData.success) {
        onSuccess(captureData);
      } else {
        onError('PayPal payment capture failed');
      }
    } catch (error) {
      console.error('onApprove error:', error);
      onError('PayPal payment capture failed');
    }
  };

  const onErrorHandler = (err: any) => {
    console.error('PayPal error:', err);
    onError('PayPal payment failed');
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
        <span className="ml-2 text-gray-600">Loading PayPal...</span>
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
        height: 50,
      }}
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
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
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