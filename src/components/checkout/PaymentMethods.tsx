'use client';
import { useState } from 'react';
import { CreditCard, Wallet, Shield, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PaymentMethodsProps {
  onSelect: (method: 'stripe' | 'paypal' | 'wallet') => void;
}

export default function PaymentMethods({ onSelect }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'wallet' | null>(null);
  const { currency } = useCurrency();
  
  // PayPal only accepts USD, Stripe accepts CAD/USD, Crypto is currency-free
  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit or Debit Card',
      description: 'Visa, Mastercard, American Express, and more',
      currencyNote: 'Accepts CAD and USD',
      icon: CreditCard,
      available: true,
      currencyCompatible: true
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with your PayPal account or credit card',
      currencyNote: 'USD only',
      icon: Wallet,
      available: currency === 'USD', // Only available for USD
      currencyCompatible: currency === 'USD',
      restrictionMessage: currency !== 'USD' ? 'PayPal only available for USD payments. Switch to USD or use another payment method.' : undefined
    },
    {
      id: 'wallet' as const,
      name: 'Connect Wallet',
      description: 'Pay with cryptocurrency using WalletConnect',
      currencyNote: 'Crypto payments (Bitcoin, Ethereum, Solana)',
      icon: Wallet,
      available: true,
      currencyCompatible: true
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
        <Shield className="h-6 w-6 text-black mr-3" />
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
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${method.available ? 'text-gray-900' : 'text-gray-500'}`}>
                      {method.name}
                    </h3>
                    <p className={`text-sm ${method.available ? 'text-gray-600' : 'text-gray-400'}`}>
                      {method.description}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${method.currencyCompatible ? 'text-green-600' : 'text-orange-600'}`}>
                      {method.currencyNote}
                    </p>
                    {method.restrictionMessage && (
                      <div className="flex items-start gap-1 mt-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-orange-700 font-medium">
                          {method.restrictionMessage}
                        </p>
                      </div>
                    )}
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