'use client';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderSuccessProps {
  orderId: string;
  customerEmail: string;
  amount: number;
}

export default function OrderSuccess({ orderId, customerEmail, amount }: OrderSuccessProps) {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center relative overflow-hidden">
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-bounce absolute top-10 left-10 text-2xl">🎉</div>
          <div className="animate-bounce absolute top-20 right-16 text-2xl" style={{ animationDelay: '0.5s' }}>✨</div>
          <div className="animate-bounce absolute top-32 left-20 text-2xl" style={{ animationDelay: '1s' }}>🎊</div>
          <div className="animate-bounce absolute top-16 right-8 text-2xl" style={{ animationDelay: '1.5s' }}>🌟</div>
        </div>
      )}

      <div className="relative z-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Thank you for your purchase. Your order has been successfully placed.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-mono text-sm">{orderId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-sm">{customerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">${amount.toFixed(2)} CAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="text-green-600 font-medium">✓ Paid</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Mail className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="font-semibold text-blue-900">Email Confirmation</h3>
            </div>
            <p className="text-blue-800 text-sm">
              We've sent an order confirmation and receipt to <strong>{customerEmail}</strong>
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Package className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="font-semibold text-purple-900">Shipping Update</h3>
            </div>
            <p className="text-purple-800 text-sm">
              You'll receive tracking information once your order ships (typically 1-2 business days)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
          
          <a
            href="/support"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@gemsutopia.ca" className="text-black hover:underline">
              support@gemsutopia.ca
            </a>{' '}
            or call{' '}
            <a href="tel:+1-555-123-4567" className="text-black hover:underline">
              +1 (555) 123-4567
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}