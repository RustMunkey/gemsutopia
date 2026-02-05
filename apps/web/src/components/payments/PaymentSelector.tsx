'use client';
import { useState } from 'react';
import { IconCreditCard, IconWallet, IconShield } from '@tabler/icons-react';
import StripePayment from './StripePayment';
import PayPalPayment from './PayPalPayment';

interface PaymentSelectorProps {
  amount: number;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  onSuccess: (paymentDetails: {
    paymentIntentId?: string;
    captureID?: string;
    paymentMethod: string;
    amount: number;
    currency: string;
  }) => void;
  onError: (error: string) => void;
  className?: string;
}

type PaymentMethod = 'stripe' | 'paypal';

export default function PaymentSelector({
  amount,
  currency = 'USD',
  items = [],
  onSuccess,
  onError,
  className = '',
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');

  const handlePaymentSuccess = (
    details: { paymentIntentId?: string; captureID?: string },
    method: PaymentMethod
  ) => {
    onSuccess({
      ...details,
      paymentMethod: method,
      amount,
      currency,
    });
  };

  const paymentMethods = [
    {
      id: 'stripe' as PaymentMethod,
      name: 'Credit Card',
      description: 'Pay securely with your credit or debit card',
      icon: IconCreditCard,
      color: 'bg-blue-600 border-blue-600',
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: IconWallet,
      color: 'bg-yellow-600 border-yellow-600',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Method Selection */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <IconShield size={20} />
          Choose Payment Method
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paymentMethods.map(method => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? `${method.color} text-white`
                    : 'border-white/20 bg-white/5 text-white hover:border-white/40'
                }`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <Icon size={20} />
                  <span className="font-semibold">{method.name}</span>
                </div>
                <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-white/70'}`}>
                  {method.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Form */}
      <div className="rounded-lg border border-white/20 bg-black/50 p-6 backdrop-blur-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between text-white">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold">
              ${amount.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {selectedMethod === 'stripe' && (
          <StripePayment
            amount={amount}
            currency={currency.toLowerCase()}
            onSuccess={paymentIntentId => handlePaymentSuccess({ paymentIntentId }, 'stripe')}
            onError={onError}
          />
        )}

        {selectedMethod === 'paypal' && (
          <PayPalPayment
            amount={amount}
            currency={currency}
            items={items}
            onSuccess={details => handlePaymentSuccess(details, 'paypal')}
            onError={onError}
          />
        )}
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-green-500/30 bg-green-900/20 p-4">
        <div className="flex items-center gap-3">
          <IconShield size={20} className="text-green-400" />
          <div>
            <p className="font-medium text-green-400">Secure Payment</p>
            <p className="text-sm text-green-300/80">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
