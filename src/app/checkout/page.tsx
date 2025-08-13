'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutFlow from '@/components/checkout/CheckoutFlow';

export default function Checkout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <CheckoutFlow />
      </main>
      <Footer />
    </div>
  );
}