'use client';
import { useState } from 'react';
import { CreditCard, Wallet, Shield } from 'lucide-react';

interface PaymentMethodsProps {
  onSelect: (method: 'stripe' | 'paypal' | 'wallet') => void;
}

export default function PaymentMethods({ onSelect }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'wallet' | null>(null);

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit or Debit Card',
      description: 'Visa, Mastercard, American Express, and more',
      icon: CreditCard,
      available: true
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with your PayPal account or credit card',
      icon: Wallet,
      available: true
    },
    {
      id: 'wallet' as const,
      name: 'Connect Wallet',
      description: 'Pay with cryptocurrency using WalletConnect',
      icon: Wallet,
      available: true
    }
  ];

  const handleContinue = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-green-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Choose Payment Method</h2>
      </div>
      
      <div className="space-y-4 mb-8">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <button
              key={method.id}
              onClick={() => method.available && setSelectedMethod(method.id)}
              disabled={!method.available}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-black bg-gray-50'
                  : method.available
                  ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${method.available ? 'text-gray-900' : 'text-gray-500'}`}>
                      {method.name}
                    </h3>
                    <p className={`text-sm ${method.available ? 'text-gray-600' : 'text-gray-400'}`}>
                      {method.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isSelected && method.available && (
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Secure Payment</h4>
            <p className="text-sm text-blue-800">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedMethod}
        className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {selectedMethod ? `Continue with ${paymentMethods.find(m => m.id === selectedMethod)?.name}` : 'Select a payment method'}
      </button>
    </div>
  );
}