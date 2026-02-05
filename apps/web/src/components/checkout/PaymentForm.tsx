'use client';
import { useState, useEffect } from 'react';
import { IconLock, IconCreditCard, IconWallet, IconCurrencyBitcoin, IconCurrencyEthereum, IconCurrencySolana } from '@tabler/icons-react';
import PayPalPayment from '../payments/PayPalPayment';

interface PaymentFormProps {
  paymentMethod: 'stripe' | 'paypal' | 'coinbase';
  amount: number;
  customerData: any;
  items: any[];
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'fixed_amount' | 'fixed';
    value: number;
    amount: number;
    free_shipping: boolean;
    // Referral-specific fields
    isReferral?: boolean;
    referralId?: string;
    referrerName?: string;
    description?: string;
    // Discount code specific
    discountCodeId?: string;
  } | null;
  subtotal: number;
  shipping: number;
  onSuccess: (data: {
    orderId: string;
    actualAmount?: number;
    cryptoAmount?: number;
    currency?: string;
    cryptoCurrency?: string;
    cryptoNetwork?: string;
  }) => void;
  onError: (error: string) => void;
}

// Helper function to clear stored referral code
function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('referralCode');
}

// Helper function to apply referral after successful order
async function applyReferral(
  referralId: string,
  orderId: string,
  orderTotal: number,
  discountApplied: number,
  customerEmail: string,
  customerName: string,
  customerId?: string
): Promise<void> {
  try {
    await fetch('/api/referrals/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralId,
        orderId,
        orderTotal,
        discountApplied,
        referredEmail: customerEmail,
        referredName: customerName,
        referredUserId: customerId,
      }),
    });
    // Clear stored referral code after successful application
    clearStoredReferralCode();
  } catch (error) {
    // Don't fail the order if referral tracking fails
    console.error('Failed to apply referral:', error);
  }
}

function StripeForm({
  amount,
  customerData,
  items,
  appliedDiscount,
  subtotal,
  shipping,
  onSuccess,
  onError,
}: Omit<PaymentFormProps, 'paymentMethod'>) {
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);

    try {
      const currentCurrency = localStorage.getItem('currency') || 'CAD';

      const response = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currentCurrency.toLowerCase(),
          customerEmail: customerData.email,
          customerData,
          items,
          subtotal,
          shipping,
          appliedDiscount,
          metadata: {
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            orderTimestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Store checkout data for when user returns
        sessionStorage.setItem(
          'stripeCheckoutData',
          JSON.stringify({
            customerData,
            items,
            subtotal,
            shipping,
            appliedDiscount,
            amount,
            currency: currentCurrency,
          })
        );

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        onError('Failed to create checkout session');
        setLoading(false);
      }
    } catch {
      onError('Failed to initialize Stripe checkout');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <IconCreditCard size={24} className="text-white" />
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
          Card Payment
        </h2>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <IconLock size={18} className="mt-0.5 flex-shrink-0 text-white/60" />
          <p className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            You'll be redirected to Stripe's secure checkout page to complete your payment.
          </p>
        </div>
      </div>

      <div className="py-2">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            Total Amount
          </span>
          <span className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
            ${amount.toFixed(2)} {localStorage.getItem('currency') || 'CAD'}
          </span>
        </div>
        <p className="mt-1 font-[family-name:var(--font-inter)] text-xs text-white/40">
          Taxes included in price
        </p>
      </div>

      <button
        onClick={handleStripeCheckout}
        disabled={loading}
        className="h-11 w-full rounded-lg bg-white font-[family-name:var(--font-inter)] text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"></div>
            Redirecting to Stripe...
          </span>
        ) : (
          'Continue to Stripe Checkout'
        )}
      </button>
    </div>
  );
}

function PayPalForm({
  amount,
  customerData,
  items,
  appliedDiscount,
  subtotal,
  shipping,
  onSuccess,
  onError,
}: Omit<PaymentFormProps, 'paymentMethod'>) {
  const [loading, setLoading] = useState(false);

  const handlePayPalSuccess = async (details: { captureID: string; status: string }) => {
    try {
      setLoading(true);

      // Get current currency for PayPal order
      const currentCurrency = localStorage.getItem('currency') || 'CAD';

      const orderData = {
        items,
        customerInfo: customerData,
        payment: {
          captureID: details.captureID,
          paymentMethod: 'paypal',
          amount,
          currency: currentCurrency,
          status: details.status,
        },
        totals: {
          subtotal,
          discount: appliedDiscount?.amount || 0,
          tax: 0, // Tax included in product price
          shipping,
          total: amount,
        },
        discountCode: appliedDiscount
          ? {
              code: appliedDiscount.code,
              type: appliedDiscount.type,
              value: appliedDiscount.value,
              amount: appliedDiscount.amount,
              free_shipping: appliedDiscount.free_shipping,
            }
          : null,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const orderResult = await response.json();

        // Apply referral if this was a referral code
        if (appliedDiscount?.isReferral && appliedDiscount.referralId) {
          await applyReferral(
            appliedDiscount.referralId,
            orderResult.order.id,
            amount,
            appliedDiscount.amount,
            customerData.email,
            `${customerData.firstName} ${customerData.lastName}`
          );
        }

        onSuccess({
          orderId: orderResult.order.id,
          actualAmount: amount,
          currency: currentCurrency,
        });
      } else {
        const responseText = await response.text();
        let errorData = { error: 'Unknown error' };
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: `Server error (${response.status}): ${responseText}` };
        }
        onError(
          `Payment processed but order save failed: ${errorData.error || 'Unknown error'}. Please contact support.`
        );
      }
    } catch {
      onError('Payment processed but order save failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalError = (error: string) => {
    setLoading(false);
    onError(error);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <IconWallet size={24} className="text-white" />
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
          PayPal Payment
        </h2>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <IconWallet size={18} className="mt-0.5 flex-shrink-0 text-white/60" />
          <p className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            Pay with your PayPal account or use a credit/debit card through PayPal.
          </p>
        </div>
      </div>

      <div className="py-2">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            Total Amount
          </span>
          <span className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
            ${amount.toFixed(2)} {localStorage.getItem('currency') || 'CAD'}
          </span>
        </div>
        <p className="mt-1 font-[family-name:var(--font-inter)] text-xs text-white/40">
          Taxes included in price
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          <p className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            Processing payment...
          </p>
        </div>
      ) : (
        <PayPalPayment
          amount={amount}
          currency={localStorage.getItem('currency') || 'CAD'}
          items={items.map(item => ({
            name: item.name || 'Gemstone',
            quantity: 1,
            price: item.price,
          }))}
          onSuccess={handlePayPalSuccess}
          onError={handlePayPalError}
        />
      )}
    </div>
  );
}

interface CryptoPrices {
  bitcoin: { usd: number; cad: number };
  ethereum: { usd: number; cad: number };
  solana: { usd: number; cad: number };
}

function CoinbaseForm({
  amount,
  customerData,
  items,
  appliedDiscount,
  subtotal,
  shipping,
  onSuccess,
  onError,
}: Omit<PaymentFormProps, 'paymentMethod'>) {
  const [loading, setLoading] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'SOL' | null>(null);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);

  const cryptoOptions = [
    { id: 'BTC' as const, name: 'Bitcoin', icon: IconCurrencyBitcoin, coingeckoId: 'bitcoin' },
    { id: 'ETH' as const, name: 'Ethereum', icon: IconCurrencyEthereum, coingeckoId: 'ethereum' },
    { id: 'SOL' as const, name: 'Solana', icon: IconCurrencySolana, coingeckoId: 'solana' },
  ];

  // Fetch crypto prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/crypto-prices');
        const data = await response.json();
        if (data.success && data.data?.prices) {
          setCryptoPrices(data.data.prices);
        }
      } catch (error) {
        console.error('Failed to fetch crypto prices:', error);
      } finally {
        setPricesLoading(false);
      }
    };
    fetchPrices();
  }, []);

  // Calculate crypto amount based on selected currency
  const getCryptoAmount = (cryptoId: 'BTC' | 'ETH' | 'SOL'): string | null => {
    if (!cryptoPrices) return null;

    const currentCurrency = (typeof window !== 'undefined' ? localStorage.getItem('currency') : 'CAD') || 'CAD';
    const currencyKey = currentCurrency.toLowerCase() as 'usd' | 'cad';

    const priceMap: Record<string, keyof CryptoPrices> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
    };

    const cryptoKey = priceMap[cryptoId];
    const priceInFiat = cryptoPrices[cryptoKey]?.[currencyKey];

    if (!priceInFiat) return null;

    const cryptoAmount = amount / priceInFiat;

    // Dynamic formatting - show enough precision to be meaningful
    if (cryptoAmount < 0.0001) {
      return cryptoAmount.toPrecision(2);
    } else if (cryptoAmount < 0.01) {
      return cryptoAmount.toPrecision(3);
    } else if (cryptoAmount < 1) {
      return cryptoAmount.toPrecision(4);
    } else {
      return cryptoAmount.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
  };

  const handleCoinbaseCheckout = async () => {
    setLoading(true);

    try {
      const currentCurrency = localStorage.getItem('currency') || 'CAD';

      const response = await fetch('/api/payments/coinbase/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currentCurrency,
          customerEmail: customerData.email,
          customerData,
          items,
          subtotal,
          shipping,
          appliedDiscount,
          metadata: {
            customerName: `${customerData.firstName} ${customerData.lastName}`,
            orderTimestamp: new Date().toISOString(),
            preferredCrypto: selectedCrypto,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.hostedUrl) {
        // Store checkout data for when user returns
        sessionStorage.setItem(
          'coinbaseCheckoutData',
          JSON.stringify({
            chargeCode: data.data.chargeCode,
            customerData,
            items,
            subtotal,
            shipping,
            appliedDiscount,
            amount,
            currency: currentCurrency,
          })
        );

        // Redirect to Coinbase Commerce hosted checkout
        window.location.href = data.data.hostedUrl;
      } else {
        onError(data.error?.message || 'Failed to create Coinbase charge');
        setLoading(false);
      }
    } catch {
      onError('Failed to initialize Coinbase checkout');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
          Crypto Payment
        </h2>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <IconLock size={18} className="mt-0.5 flex-shrink-0 text-white/60" />
          <p className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            Select your preferred currency. You'll complete payment on Coinbase.
          </p>
        </div>
      </div>

      {/* Crypto Selection Buttons */}
      <div className="space-y-2">
        {cryptoOptions.map(crypto => {
          const Icon = crypto.icon;
          const isSelected = selectedCrypto === crypto.id;
          const cryptoAmount = getCryptoAmount(crypto.id);

          return (
            <button
              key={crypto.id}
              onClick={() => setSelectedCrypto(crypto.id)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={24} className="text-white" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-inter)] text-base font-medium text-white">
                      {crypto.name}
                    </span>
                    <span className="font-[family-name:var(--font-inter)] text-sm text-white/50">
                      {crypto.id}
                    </span>
                  </div>
                  {cryptoAmount && (
                    <span className="font-[family-name:var(--font-inter)] text-sm text-white/40">
                      ≈ {cryptoAmount} {crypto.id}
                    </span>
                  )}
                  {pricesLoading && (
                    <span className="font-[family-name:var(--font-inter)] text-sm text-white/40">
                      Loading price...
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                    <div className="h-2 w-2 rounded-full bg-black" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-inter)] text-sm text-white/60">
            Total Amount
          </span>
          <div className="text-right">
            {selectedCrypto && getCryptoAmount(selectedCrypto) ? (
              <span className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
                {getCryptoAmount(selectedCrypto)} {selectedCrypto}
              </span>
            ) : (
              <span className="font-[family-name:var(--font-inter)] text-lg font-semibold text-white">
                ${amount.toFixed(2)} {typeof window !== 'undefined' ? localStorage.getItem('currency') || 'CAD' : 'CAD'}
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 font-[family-name:var(--font-inter)] text-xs text-white/40">
          Taxes included in price
        </p>
      </div>

      <button
        onClick={handleCoinbaseCheckout}
        disabled={loading || !selectedCrypto}
        className={`h-11 w-full rounded-lg font-[family-name:var(--font-inter)] text-sm font-medium transition-all ${
          selectedCrypto
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-white/10 text-white/50 cursor-not-allowed'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"></div>
            Redirecting to Coinbase...
          </span>
        ) : selectedCrypto ? (
          `Pay with ${selectedCrypto}`
        ) : (
          'Select a currency'
        )}
      </button>
    </div>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  if (props.paymentMethod === 'stripe') {
    return <StripeForm {...props} />;
  }

  if (props.paymentMethod === 'coinbase') {
    return <CoinbaseForm {...props} />;
  }

  // PayPal payment form
  return <PayPalForm {...props} />;
}
