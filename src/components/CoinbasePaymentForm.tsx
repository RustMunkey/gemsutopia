'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Lock, Bitcoin } from 'lucide-react';

interface CoinbasePaymentFormProps {
  items: Array<{ id: number; name: string; price: number; image: string; quantity?: number }>;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  onPaymentSuccess: (details: Record<string, unknown>) => void;
  onPaymentError: (error: string) => void;
}

const CoinbasePaymentForm = ({ items, customerInfo, onPaymentSuccess, onPaymentError }: CoinbasePaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [chargeData, setChargeData] = useState<Record<string, unknown> | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shipping = subtotal > 300 ? 0 : 15;
  const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100;
  const total = subtotal + shipping + tax;

  const createCharge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coinbase/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({ 
            ...item, 
            quantity: item.quantity || 1 
          })),
          customerInfo,
          amount: total.toFixed(2),
        }),
      });

      const data = await response.json();

      if (data.error) {
        onPaymentError(data.error);
        return;
      }

      setChargeData(data);
    } catch {
      onPaymentError('Failed to create crypto payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!chargeData?.id) return;

    setCheckingPayment(true);
    try {
      const response = await fetch(`/api/coinbase/check-payment/${chargeData.id}`);
      const data = await response.json();

      if (data.status === 'COMPLETED') {
        onPaymentSuccess(data);
        return;
      } else if (data.status === 'EXPIRED' || data.status === 'CANCELED') {
        onPaymentError('Payment expired or was canceled. Please try again.');
        setChargeData(null);
      }
    } catch {
    } finally {
      setCheckingPayment(false);
    }
  };

  // Poll payment status every 5 seconds when charge is created
  useEffect(() => {
    if (!chargeData?.id) return;

    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [chargeData?.id, checkPaymentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (!chargeData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setChargeData(null);
          onPaymentError('Payment expired. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [chargeData, onPaymentError]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Bitcoin className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold text-black">Crypto Payment</h2>
        <Lock className="h-4 w-4 text-green-600 ml-auto" />
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax (HST)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)} CAD</span>
          </div>
        </div>
      </div>

      {!chargeData ? (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Supported Cryptocurrencies:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Bitcoin (BTC)</p>
              <p>• Ethereum (ETH)</p>
              <p>• Litecoin (LTC)</p>
              <p>• Bitcoin Cash (BCH)</p>
              <p>• USD Coin (USDC)</p>
              <p>• And many more...</p>
            </div>
          </div>

          <button
            onClick={createCharge}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Payment...
              </>
            ) : (
              <>
                <Bitcoin className="h-5 w-5" />
                Pay with Crypto - ${total.toFixed(2)} CAD
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-orange-900 mb-2">Payment Created!</h3>
            <p className="text-sm text-orange-800 mb-2">
              Time remaining: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-3">
              Complete your payment by visiting the Coinbase Commerce payment page:
            </p>
            <a
              href={chargeData.hosted_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              Open Coinbase Payment Page
            </a>
          </div>

          <div className="text-center">
            <button
              onClick={checkPaymentStatus}
              disabled={checkingPayment}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              {checkingPayment ? 'Checking...' : 'Check Payment Status'}
            </button>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This page will automatically update when your payment is confirmed. 
              Please keep this tab open and complete your payment within the time limit.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secured by Coinbase Commerce • Your payment is processed securely</span>
      </div>
    </div>
  );
};

export default CoinbasePaymentForm;