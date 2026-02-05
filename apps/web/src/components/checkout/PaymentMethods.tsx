'use client';
import { useState } from 'react';
import { IconCreditCard, IconBrandPaypal, IconBrandCoinbase, IconCheck, IconLock, IconShieldCheck, IconMail } from '@tabler/icons-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import Link from 'next/link';

interface PaymentMethodsProps {
  onSelect: (method: 'stripe' | 'paypal' | 'coinbase') => void;
}

export default function PaymentMethods({ onSelect }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'coinbase' | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { currency } = useCurrency();

  const isUSD = currency === 'USD';

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit or Debit',
      icon: IconCreditCard,
      available: true,
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      icon: IconBrandPaypal,
      available: isUSD,
    },
    {
      id: 'coinbase' as const,
      name: 'Coinbase',
      icon: IconBrandCoinbase,
      available: true,
    },
  ];

  const handleSelect = (methodId: 'stripe' | 'paypal' | 'coinbase') => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method?.available) {
      setSelectedMethod(methodId);
    }
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    }
  };

  return (
    <div className="space-y-4">
      {paymentMethods.map(method => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <button
            key={method.id}
            onClick={() => handleSelect(method.id)}
            disabled={!method.available}
            className={`group relative w-full rounded-xl border p-4 text-left transition-all xs:p-5 ${
              isSelected
                ? 'border-white/30 bg-white/10'
                : method.available
                  ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <Icon size={24} className={method.available ? 'text-white' : 'text-white/40'} />
              <div className="flex-1">
                <span className={`font-[family-name:var(--font-inter)] text-base font-semibold ${method.available ? 'text-white' : 'text-white/40'}`}>
                  {method.name}
                </span>
                {method.id === 'paypal' && !isUSD && (
                  <span className="ml-2 font-[family-name:var(--font-inter)] text-xs text-white/30">
                    USD only
                  </span>
                )}
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <IconCheck size={14} className="text-black" />
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Terms Agreement */}
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 xs:p-4">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={e => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-white"
        />
        <span className="font-[family-name:var(--font-inter)] text-xs text-white/70 xs:text-sm">
          I agree to the{' '}
          <Link href="/terms-of-service" target="_blank" className="underline underline-offset-2 hover:text-white">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/refund-policy" target="_blank" className="underline underline-offset-2 hover:text-white">
            Refund Policy
          </Link>
        </span>
      </label>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!selectedMethod || !agreedToTerms}
        className="mt-4 h-10 w-full rounded-lg bg-white font-[family-name:var(--font-inter)] text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50 xs:h-11 xs:text-base"
      >
        {!selectedMethod ? 'Select a payment method' : !agreedToTerms ? 'Accept terms to continue' : 'Continue'}
      </button>

      {/* Trust Signals */}
      <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-white/50">
          <IconLock size={14} />
          <span className="font-[family-name:var(--font-inter)] text-xs">
            256-bit SSL encrypted checkout
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <IconShieldCheck size={14} />
          <span className="font-[family-name:var(--font-inter)] text-xs">
            30-day money-back guarantee
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <IconMail size={14} />
          <span className="font-[family-name:var(--font-inter)] text-xs">
            Need help? Contact us at support@gemsutopia.ca
          </span>
        </div>
      </div>

      {/* Continue Shopping Link */}
      <Link
        href="/shop"
        className="mt-4 block text-center font-[family-name:var(--font-inter)] text-sm text-white/60 transition-colors hover:text-white"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
