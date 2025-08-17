'use client';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencySwitcherProps {
  variant?: 'header' | 'mobile';
}

export default function CurrencySwitcher({ variant = 'header' }: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'CAD' : 'USD');
  };

  const getCurrentFlag = () => {
    return currency === 'USD' ? '🇺🇸' : '🇨🇦';
  };

  if (variant === 'mobile') {
    return (
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-900 mb-2">Currency</div>
        <button
          onClick={toggleCurrency}
          className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors bg-black text-white w-full"
        >
          <span className="text-base">{getCurrentFlag()}</span>
          <span>{currency}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleCurrency}
      className="text-white hover:text-gray-300 transition-colors"
      title={`Switch to ${currency === 'USD' ? 'CAD' : 'USD'}`}
    >
      <span className="text-xl">{getCurrentFlag()}</span>
    </button>
  );
}