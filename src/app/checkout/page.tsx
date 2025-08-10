'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGemPouch } from '@/contexts/GemPouchContext';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Checkout() {
  const { items, removeItem } = useGemPouch();
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
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const shipping = subtotal > 300 ? 0 : 15; // Free shipping over $300
  const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100; // 13% tax
  const total = subtotal + shipping + tax;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle checkout submission
    console.log('Checkout submitted:', { formData, items, total });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col relative">
        {/* Fixed Background */}
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
      {/* Fixed Background */}
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Checkout Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-8">Checkout</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h2 className="text-lg font-semibold text-black mb-4">Contact Information</h2>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="text-lg font-semibold text-black mb-4">Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
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
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="Province"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="Postal code"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h2 className="text-lg font-semibold text-black mb-4">Payment Information</h2>
                  <input
                    type="text"
                    name="nameOnCard"
                    placeholder="Name on card"
                    value={formData.nameOnCard}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
                    required
                  />
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="Card number"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      name="cvv"
                      placeholder="CVV"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-black mb-6">Order Summary</h2>
              
              {/* Items */}
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
                      <p className="font-semibold text-black">${item.price * item.quantity}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-neutral-600">${item.price} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="text-black">${subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="text-black">{shipping === 0 ? 'Free' : `$${shipping}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tax (HST)</span>
                  <span className="text-black">${tax}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-black">Total</span>
                    <span className="text-lg font-semibold text-black">${total}</span>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-black">Secure Checkout</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-neutral-600">Free shipping on orders over $300</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-neutral-600">All major credit cards accepted</span>
                </div>
              </div>

              {/* Complete Order Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-black text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-neutral-800 transition-colors"
              >
                Complete Order - ${total}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}