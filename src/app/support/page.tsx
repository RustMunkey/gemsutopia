import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Clock, CircleAlert } from 'lucide-react';

export default function Support() {
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
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Support Center</h1>
              <p className="text-lg text-neutral-600">We&apos;re here to help you with any questions</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Mail className="h-12 w-12 text-black mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">Email Support</h3>
              <p className="text-neutral-600 mb-4">Get help via email</p>
              <a href="mailto:gemsutopia@gmail.com" className="text-black font-semibold hover:underline">
                gemsutopia@gmail.com
              </a>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <Clock className="h-12 w-12 text-black mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">Response Time</h3>
              <p className="text-neutral-600 mb-4">We typically respond within</p>
              <p className="text-black font-semibold">24 hours</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <CircleAlert className="h-12 w-12 text-black mx-auto mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">FAQ</h3>
              <p className="text-neutral-600 mb-4">Your questions answered</p>
              <a href="#faq" className="text-black font-semibold hover:underline">
                View FAQ
              </a>
            </div>
          </div>
          
          <div id="faq">
            <h2 className="text-2xl font-bold text-black mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-black mb-3">How do I track my order?</h3>
                <p className="text-neutral-600">
                  Once your order is shipped, you&apos;ll receive a tracking number via email. You can use this number to track your package on our shipping partner&apos;s website.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-black mb-3">What is your return policy?</h3>
                <p className="text-neutral-600">
                  We offer a 30-day return policy for all items in original condition. Please see our Returns & Exchange page for detailed information.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-black mb-3">Are your gemstones authentic?</h3>
                <p className="text-neutral-600">
                  Yes, all our gemstones come with certificates of authenticity and are sourced from trusted suppliers worldwide.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-black mb-3">How long does shipping take?</h3>
                <p className="text-neutral-600">
                  Standard shipping takes 3-5 business days. Express shipping options are available at checkout for faster delivery.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}