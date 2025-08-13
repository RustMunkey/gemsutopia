'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGemPouch } from '@/contexts/GemPouchContext';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, XCircle, CreditCard, Bitcoin } from 'lucide-react';
import Link from 'next/link';
import StripePayment from '@/components/payments/StripePayment';
import PayPalPayment from '@/components/payments/PayPalPayment';

export default function Checkout() {
  const { items, clearPouch } = useGemPouch();
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment-method' | 'payment' | 'success' | 'error'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<{id: string; amount?: number} | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Canada',
  });

  // Group items by id to show quantities
  const groupedItems = items.reduce((acc, item) => {
    const existing = acc.find(group => group.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ ...item, quantity: 1 });
    }
    return acc;
  }, [] as Array<{ id: number; name: string; price: number; image: string; quantity: number }>);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const shipping = subtotal > 300 ? 0 : 15;
  const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Move to payment method selection step
    setPaymentStep('payment-method');
  };

  const handlePaymentSuccess = async (paymentDetails: {paymentIntentId?: string; captureID?: string; paymentMethod: string; amount: number; currency: string}) => {
    try {
      // Save order to database
      const orderData = {
        items: groupedItems,
        customerInfo: formData,
        payment: paymentDetails,
        totals: { subtotal, shipping, tax, total },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        setPaymentSuccess({ 
          id: paymentDetails.paymentIntentId || paymentDetails.captureID || 'order-' + Date.now(), 
          amount: total * 100 
        });
        setPaymentStep('success');
        clearPouch();
      } else {
        throw new Error('Failed to save order');
      }
    } catch (error) {
      console.error('Order processing failed:', error);
      setPaymentError('Failed to process order. Please contact support.');
      setPaymentStep('error');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setPaymentStep('error');
  };

  if (items.length === 0 && paymentStep !== 'success') {
    return (
      <div className="min-h-screen flex flex-col relative">
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url('/images/whitemarble.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        />
        
        <Header />
        
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <h1 className="text-3xl font-bold text-black mb-4">Your cart is empty</h1>
              <p className="text-neutral-600 mb-8">Add some gems to your pouch before checking out.</p>
              <Link
                href="/shop"
                className="inline-block bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <Header />
      
      <div className="flex-grow py-8 md:py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link href="/gem-pouch" className="inline-flex items-center text-black hover:text-neutral-600 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gem Pouch
          </Link>

          {/* Success Screen */}
          {paymentStep === 'success' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-black mb-4">Payment Successful!</h1>
                <p className="text-neutral-600 mb-6">
                  Thank you for your purchase. Your order has been confirmed and you will receive an email confirmation shortly.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Payment ID: {paymentSuccess?.id}</p>
                  {paymentSuccess?.amount && (
                    <p className="text-lg font-semibold text-black">
                      Amount: ${(paymentSuccess.amount / 100).toFixed(2)} CAD
                    </p>
                  )}
                </div>
                <Link
                  href="/shop"
                  className="inline-block bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {/* Error Screen */}
          {paymentStep === 'error' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-black mb-4">Payment Failed</h1>
                <p className="text-neutral-600 mb-6">{paymentError}</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setPaymentStep('payment')}
                    className="bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setPaymentStep('form')}
                    className="border-2 border-black text-black py-3 px-8 rounded-full font-semibold hover:bg-black hover:text-white transition-colors"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Checkout Flow */}
          {(paymentStep === 'form' || paymentStep === 'payment-method' || paymentStep === 'payment') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Customer Information Form */}
              {paymentStep === 'form' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
                  <h1 className="text-2xl md:text-3xl font-bold text-black mb-8">Checkout</h1>
                  
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-black mb-4">Contact Information</h2>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email address *"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-black mb-4">Shipping Address</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          name="firstName"
                          placeholder="First name *"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Last name *"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        name="address"
                        placeholder="Address *"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
                        required
                      />
                      <input
                        type="text"
                        name="apartment"
                        placeholder="Apartment, suite, etc. (optional)"
                        value={formData.apartment}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          name="city"
                          placeholder="City *"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          name="state"
                          placeholder="Province *"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="Postal code *"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-neutral-800 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </div>
              )}

              {/* Payment Section */}
              {paymentStep === 'payment' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-black mb-8">Payment</h2>
                  
                  {selectedPaymentMethod === 'stripe' && (
                    <StripePayment
                      amount={total}
                      currency="cad"
                      onSuccess={(paymentIntentId) =>
                        handlePaymentSuccess({ 
                          paymentIntentId, 
                          paymentMethod: 'stripe',
                          amount: total,
                          currency: 'CAD'
                        })
                      }
                      onError={handlePaymentError}
                      className="mb-6"
                    />
                  )}

                  {selectedPaymentMethod === 'paypal' && (
                    <PayPalPayment
                      amount={total}
                      currency="CAD"
                      items={groupedItems.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                      }))}
                      onSuccess={(details) =>
                        handlePaymentSuccess({
                          captureID: details.captureID,
                          paymentMethod: 'paypal',
                          amount: total,
                          currency: 'CAD'
                        })
                      }
                      onError={handlePaymentError}
                      className="mb-6"
                    />
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setPaymentStep('payment-method')}
                      className="flex-1 border-2 border-gray-300 text-gray-600 py-3 px-6 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                    >
                      ← Change Payment Method
                    </button>
                    <button
                      onClick={() => setPaymentStep('form')}
                      className="flex-1 border-2 border-black text-black py-3 px-6 rounded-full font-semibold hover:bg-black hover:text-white transition-colors"
                    >
                      ← Back to Details
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              {paymentStep === 'payment-method' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-black mb-8">Choose Payment Method</h2>
                  
                  <div className="space-y-4">
                    {/* Credit Card / Stripe */}
                    <button
                      onClick={() => {
                        setSelectedPaymentMethod('stripe');
                        setPaymentStep('payment');
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-8 w-8 text-black" />
                        <div>
                          <h3 className="font-semibold text-black">Credit or Debit Card</h3>
                          <p className="text-sm text-gray-600">Visa, Mastercard, American Express, and more</p>
                        </div>
                      </div>
                    </button>

                    {/* PayPal */}
                    <button
                      onClick={() => {
                        setSelectedPaymentMethod('paypal');
                        setPaymentStep('payment');
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white font-bold text-sm">PP</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-black">PayPal</h3>
                          <p className="text-sm text-gray-600">Pay with your PayPal account or credit card</p>
                        </div>
                      </div>
                    </button>

                    {/* Cryptocurrency */}
                    <button
                      onClick={() => {}}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Bitcoin className="h-8 w-8 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-black">Cryptocurrency</h3>
                          <p className="text-sm text-gray-600">Bitcoin, Ethereum, and other cryptocurrencies</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setPaymentStep('form')}
                    className="w-full mt-6 border-2 border-black text-black py-3 px-6 rounded-full font-semibold hover:bg-black hover:text-white transition-colors"
                  >
                    ← Back to Details
                  </button>
                </div>
              )}


              {/* Order Summary */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-black mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {groupedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-200">
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden relative">
                        <Image 
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-black">{item.name}</h3>
                        <p className="text-neutral-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-black">${(item.price * item.quantity).toFixed(2)}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-neutral-600">${item.price.toFixed(2)} each</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="text-black">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Shipping</span>
                    <span className="text-black">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tax (HST)</span>
                    <span className="text-black">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-black">Total</span>
                      <span className="text-lg font-semibold text-black">${total.toFixed(2)} CAD</span>
                    </div>
                  </div>
                </div>

                {paymentStep === 'payment' && (
                  <button
                    onClick={() => setPaymentStep('payment-method')}
                    className="w-full border border-gray-300 text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    ← Change Payment Method
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}