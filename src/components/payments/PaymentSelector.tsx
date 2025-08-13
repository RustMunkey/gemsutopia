'use client';
import { useState } from 'react';
import { CreditCard, Wallet, Shield } from 'lucide-react';
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
  onSuccess: (paymentDetails: {paymentIntentId?: string; captureID?: string; paymentMethod: string; amount: number; currency: string}) => void;
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

  const handlePaymentSuccess = (details: {paymentIntentId?: string; captureID?: string}, method: PaymentMethod) => {
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
      icon: CreditCard,
      color: 'bg-blue-600 border-blue-600',
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: Wallet,
      color: 'bg-yellow-600 border-yellow-600',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Choose Payment Method
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `${method.color} text-white`
                    : 'bg-white/5 border-white/20 text-white hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-5 w-5" />
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
      <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <div className="mb-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold">${amount.toFixed(2)} {currency}</span>
          </div>
        </div>

        {selectedMethod === 'stripe' && (
          <StripePayment
            amount={amount}
            currency={currency.toLowerCase()}
            onSuccess={(paymentIntentId) =>
              handlePaymentSuccess({ paymentIntentId }, 'stripe')
            }
            onError={onError}
          />
        )}

        {selectedMethod === 'paypal' && (
          <PayPalPayment
            amount={amount}
            currency={currency}
            items={items}
            onSuccess={(details) => handlePaymentSuccess(details, 'paypal')}
            onError={onError}
          />
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">Secure Payment</p>
            <p className="text-green-300/80 text-sm">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}