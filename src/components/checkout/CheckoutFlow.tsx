'use client';
import { useState } from 'react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import CartReview from './CartReview';
import CustomerInfo from './CustomerInfo';
import PaymentMethods from './PaymentMethods';
import PaymentForm from './PaymentForm';
import OrderSuccess from './OrderSuccess';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface CheckoutData {
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: 'stripe' | 'paypal' | null;
  orderTotal: number;
}

type CheckoutStep = 'cart' | 'customer' | 'payment-method' | 'payment' | 'success' | 'error';

export default function CheckoutFlow() {
  const { items, clearPouch } = useGemPouch();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customer: {
      email: '',
      firstName: '',
      lastName: '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Canada',
      phone: ''
    },
    paymentMethod: null,
    orderTotal: 0
  });
  const [orderId, setOrderId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.13; // 13% HST for Canada
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;

  const updateCheckoutData = (updates: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...updates }));
  };

  const handleStepComplete = (step: CheckoutStep, data?: any) => {
    switch (step) {
      case 'cart':
        setCurrentStep('customer');
        break;
      case 'customer':
        updateCheckoutData({ customer: data });
        setCurrentStep('payment-method');
        break;
      case 'payment-method':
        updateCheckoutData({ paymentMethod: data });
        setCurrentStep('payment');
        break;
      case 'payment':
        setOrderId(data.orderId);
        setCurrentStep('success');
        clearPouch();
        break;
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('error');
  };

  const goBack = () => {
    switch (currentStep) {
      case 'customer':
        setCurrentStep('cart');
        break;
      case 'payment-method':
        setCurrentStep('customer');
        break;
      case 'payment':
        setCurrentStep('payment-method');
        break;
      case 'error':
        setCurrentStep('payment');
        break;
    }
  };

  const stepTitles = {
    cart: 'Review Your Order',
    customer: 'Shipping Information',
    'payment-method': 'Choose Payment Method',
    payment: 'Payment Details',
    success: 'Order Confirmed!',
    error: 'Payment Error'
  };

  if (items.length === 0 && currentStep !== 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to get started</p>
          <a
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          {currentStep !== 'success' && (
            <button
              onClick={goBack}
              disabled={currentStep === 'cart'}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900">
            {stepTitles[currentStep]}
          </h1>
          
          {currentStep !== 'success' && currentStep !== 'error' && (
            <div className="mt-4 flex items-center space-x-4">
              {['cart', 'customer', 'payment-method', 'payment'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step
                        ? 'bg-black text-white'
                        : ['cart', 'customer', 'payment-method', 'payment'].indexOf(currentStep) > index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        ['cart', 'customer', 'payment-method', 'payment'].indexOf(currentStep) > index
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 'cart' && (
              <CartReview
                items={items}
                onContinue={() => handleStepComplete('cart')}
              />
            )}
            
            {currentStep === 'customer' && (
              <CustomerInfo
                data={checkoutData.customer}
                onContinue={(customerData) => handleStepComplete('customer', customerData)}
              />
            )}
            
            {currentStep === 'payment-method' && (
              <PaymentMethods
                onSelect={(method) => handleStepComplete('payment-method', method)}
              />
            )}
            
            {currentStep === 'payment' && (
              <PaymentForm
                paymentMethod={checkoutData.paymentMethod!}
                amount={total}
                customerData={checkoutData.customer}
                items={items}
                onSuccess={(data) => handleStepComplete('payment', data)}
                onError={handleError}
              />
            )}
            
            {currentStep === 'success' && (
              <OrderSuccess
                orderId={orderId}
                customerEmail={checkoutData.customer.email}
                amount={total}
              />
            )}
            
            {currentStep === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Failed</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => setCurrentStep('payment')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== 'success' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (HST)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${total.toFixed(2)} CAD</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}