'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWallet } from '@/contexts/WalletContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import CartReview from './CartReview';
import CustomerInfo from './CustomerInfo';
import PaymentMethods from './PaymentMethods';
import PaymentForm from './PaymentForm';
import OrderSuccess from './OrderSuccess';
import { ArrowLeft } from 'lucide-react';
import { calculateTax, TaxCalculationResult } from '@/lib/utils/taxCalculation';
import { calculateShipping, ShippingSettings, ShippingCalculation } from '@/lib/utils/shipping';

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
  paymentMethod: 'stripe' | 'paypal' | 'wallet' | null;
  orderTotal: number;
}

type CheckoutStep = 'cart' | 'customer' | 'payment-method' | 'payment' | 'success' | 'error';

export default function CheckoutFlow() {
  const router = useRouter();
  const { items, clearPouch } = useGemPouch();
  const { formatPrice } = useCurrency();
  const { isConnected, disconnectWallet } = useWallet();
  const { showNotification } = useNotification();
  const { refreshShopProducts, refreshProduct } = useInventory();
  const analytics = useAnalytics();
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

  // Load saved customer data and shipping settings on mount
  useEffect(() => {
    const savedCustomerData = localStorage.getItem('customerShippingInfo');
    if (savedCustomerData) {
      try {
        const parsed = JSON.parse(savedCustomerData);
        setCheckoutData(prev => ({
          ...prev,
          customer: parsed
        }));
      } catch (error) {
        console.error('Error loading saved customer data:', error);
      }
    }

    // Load shipping settings
    async function loadShippingSettings() {
      try {
        const response = await fetch('/api/shipping-settings');
        if (response.ok) {
          const data = await response.json();
          setShippingSettings(data.settings);
        }
      } catch (error) {
        console.error('Error loading shipping settings:', error);
      }
    }

    loadShippingSettings();
  }, []);
  const [orderId, setOrderId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [paymentInfo, setPaymentInfo] = useState<{
    actualAmount: number;
    cryptoAmount?: number;
    currency: string;
    cryptoCurrency?: string;
    cryptoPrices?: any;
  } | null>(null);
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculationResult | null>(null);
  const [calculatingTax, setCalculatingTax] = useState(false);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    amount: number;
    free_shipping: boolean;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string>('');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount
  const discount = appliedDiscount?.amount || 0;
  const subtotalAfterDiscount = subtotal - discount;
  
  // Calculate tax - use stored calculation or default to 0
  const tax = taxCalculation?.amount || 0;
  const taxLabel = taxCalculation?.rate.name || 'Tax';
  
  // Calculate shipping dynamically
  const shipping = React.useMemo(() => {
    if (appliedDiscount?.free_shipping) {
      return 0; // Free shipping from discount
    }
    
    if (!shippingSettings || items.length === 0) {
      return 0; // No items or settings not loaded
    }

    // Get current currency from context
    const currentCurrency = localStorage.getItem('currency') as 'CAD' | 'USD' || 'CAD';
    const calculation = calculateShipping(items.length, currentCurrency, shippingSettings);
    
    return calculation.shippingCost;
  }, [appliedDiscount?.free_shipping, shippingSettings, items.length]);
  
  const total = subtotalAfterDiscount + tax + shipping;

  // Track checkout start event when component loads and total is calculated
  useEffect(() => {
    if (analytics && items.length > 0 && total > 0) {
      analytics.trackCheckoutStart(total, items.length);
    }
  }, [analytics, items.length, total]);

  // Effect to calculate tax when payment method is selected (after customer info)
  useEffect(() => {
    async function calculateTaxForOrder() {
      // Only calculate tax if we have customer info AND payment method selected
      if (
        checkoutData.paymentMethod && 
        checkoutData.customer.country && 
        checkoutData.customer.state && 
        checkoutData.customer.city && 
        checkoutData.customer.zipCode
      ) {
        setCalculatingTax(true);
        try {
          const result = await calculateTax(
            subtotalAfterDiscount, // Tax calculated on discounted amount
            checkoutData.customer.country,
            checkoutData.customer.state,
            checkoutData.customer.city,
            checkoutData.customer.zipCode,
            checkoutData.customer.address,
            checkoutData.paymentMethod === 'wallet' ? 'crypto' : 'card' // Crypto vs regular payment
          );
          setTaxCalculation(result);
        } catch (error) {
          console.error('Tax calculation error:', error);
          // Fallback to 0 tax if calculation fails
          setTaxCalculation({
            amount: 0,
            rate: { federal: 0, total: 0, name: 'Tax' }
          });
        } finally {
          setCalculatingTax(false);
        }
      } else {
        // Reset tax calculation if payment method not selected
        setTaxCalculation(null);
      }
    }

    calculateTaxForOrder();
  }, [checkoutData.paymentMethod, checkoutData.customer, subtotalAfterDiscount]);

  const updateCheckoutData = (updates: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...updates }));
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setDiscountError('');
    
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode.trim(),
          orderTotal: subtotal
        })
      });

      const result = await response.json();

      if (result.valid && result.discount) {
        setAppliedDiscount(result.discount);
        setDiscountCode('');
        showNotification('success', result.message);
      } else {
        setDiscountError(result.message || 'Invalid discount code');
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscountError('Error validating discount code');
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
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
        setPaymentInfo({
          actualAmount: data.actualAmount || total,
          cryptoAmount: data.cryptoAmount,
          currency: data.currency || 'CAD',
          cryptoCurrency: data.cryptoCurrency,
          cryptoPrices: data.cryptoPrices
        });
        
        // Track purchase completion
        if (analytics) {
          analytics.trackCheckoutComplete(data.orderId, data.actualAmount || total);
        }
        
        setCurrentStep('success');
        clearPouch();
        refreshShopProducts(); // Trigger real-time inventory update
        
        // Also refresh individual product pages for items that were purchased
        items.forEach(item => {
          refreshProduct(item.id);
        });
        break;
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('error');
  };

  const goBack = () => {
    // If wallet is connected and we're going back from payment step, disconnect wallet
    if (currentStep === 'payment' && isConnected) {
      disconnectWallet();
      showNotification('info', 'Wallet disconnected');
    }
    
    switch (currentStep) {
      case 'cart':
        router.push('/shop');
        break;
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
    // Redirect to gem-pouch page instead of showing empty cart screen
    if (typeof window !== 'undefined') {
      window.location.href = '/gem-pouch';
    }
    return null;
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          {currentStep !== 'success' && (
            <button
              onClick={goBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 relative z-20 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          )}
          
          <h1 className={`text-3xl font-bold text-gray-900 ${currentStep === 'success' ? 'text-center' : ''}`}>
            {stepTitles[currentStep]}
          </h1>
          
          {currentStep !== 'success' && currentStep !== 'error' && (
            <div className="mt-4 flex items-center">
              {['cart', 'customer', 'payment-method', 'payment'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step
                        ? 'bg-black text-white'
                        : ['cart', 'customer', 'payment-method', 'payment'].indexOf(currentStep) > index
                        ? 'bg-black text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-16 h-0.5 ${
                        ['cart', 'customer', 'payment-method', 'payment'].indexOf(currentStep) > index
                          ? 'bg-black'
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
          <div className={`${currentStep === 'success' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            {currentStep === 'cart' && (
              <CartReview
                items={items}
                onContinue={() => handleStepComplete('cart')}
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                appliedDiscount={appliedDiscount}
                discountError={discountError}
                validateDiscountCode={validateDiscountCode}
                removeDiscount={removeDiscount}
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
                appliedDiscount={appliedDiscount}
                subtotal={subtotal}
                tax={tax}
                shipping={shipping}
                onSuccess={(data) => handleStepComplete('payment', data)}
                onError={handleError}
              />
            )}
            
            {currentStep === 'success' && (
              <div className="flex justify-center">
                <div className="max-w-2xl w-full">
                  <OrderSuccess
                    orderId={orderId}
                    customerEmail={checkoutData.customer.email}
                    customerName={`${checkoutData.customer.firstName} ${checkoutData.customer.lastName}`}
                    amount={paymentInfo?.actualAmount || total}
                    cryptoAmount={paymentInfo?.cryptoAmount}
                    currency={paymentInfo?.currency || 'CAD'}
                    cryptoCurrency={paymentInfo?.cryptoCurrency}
                    cryptoPrices={paymentInfo?.cryptoPrices}
                    items={items}
                    subtotal={subtotal}
                    tax={tax}
                    shipping={shipping}
                    paymentMethod={checkoutData.paymentMethod || undefined}
                    shippingMethod={'flat'}
                    appliedDiscount={appliedDiscount || undefined}
                    taxRate={taxCalculation?.rate?.total || undefined}
                    taxLabel={taxCalculation?.rate?.name}
                    shippingAddress={checkoutData.customer}
                  />
                </div>
              </div>
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
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {items.map((item, index) => (
                    <div key={`order-item-${index}-${item.id}`} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {currentStep !== 'cart' && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{taxLabel}</span>
                        <span>
                          {calculatingTax ? (
                            <span className="animate-pulse">Calculating...</span>
                          ) : (
                            formatPrice(tax)
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(currentStep === 'cart' ? subtotalAfterDiscount : total)}</span>
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