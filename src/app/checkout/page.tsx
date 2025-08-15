'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutFlow from '@/components/checkout/CheckoutFlow';

export default function Checkout() {
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
      
      <div className="relative z-10">
        <Header />
      </div>
      
      <main className="flex-grow relative z-10">
        <CheckoutFlow />
      </main>
      
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}