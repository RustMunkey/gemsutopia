import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RefundPolicy() {
  return (
    <div className="bg-black min-h-screen flex flex-col">
      <Header />
      
      <div 
        className="flex-grow py-16"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Refund Policy</h1>
            <p className="text-lg text-neutral-600">Your satisfaction is our priority</p>
          </div>
          
          <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">30-Day Money Back Guarantee</h2>
              <p className="mb-4">
                We stand behind the quality of our products. If you&apos;re not completely satisfied with your purchase, you may return it within 30 days of delivery for a full refund.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Refund Process</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact our customer service team to initiate a return</li>
                <li>Return items must be in original condition with all packaging</li>
                <li>Refunds are processed within 5-7 business days after we receive your return</li>
                <li>Original shipping costs are non-refundable</li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Exceptions</h2>
              <p className="mb-4">
                Custom or personalized items cannot be returned unless defective. Sale items are final sale and cannot be returned for refund, but may be exchanged for store credit.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Damaged or Defective Items</h2>
              <p className="mb-4">
                If you receive a damaged or defective item, please contact us immediately. We will provide a prepaid return label and process your refund or replacement as soon as possible.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
              <p>
                For questions about our refund policy or to initiate a return, please contact us at support@gemsutopia.com or call +1 (555) 123-4567.
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}