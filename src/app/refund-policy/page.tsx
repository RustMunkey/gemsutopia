'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RefundPolicy() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/refund-policy')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Refund Policy",
    subtitle: "Your satisfaction is our priority",
    guarantee_title: "30-Day Money Back Guarantee",
    guarantee_content: "We stand behind the quality of our products. If you're not completely satisfied with your purchase, you may return it within 30 days of delivery for a full refund.",
    process_title: "Refund Process",
    process_item_1: "Contact our customer service team to initiate a return",
    process_item_2: "Return items must be in original condition with all packaging",
    process_item_3: "Refunds are processed within 5-7 business days after we receive your return",
    process_item_4: "Original shipping costs are non-refundable",
    exceptions_title: "Exceptions",
    exceptions_content: "Custom or personalized items cannot be returned unless defective. Sale items are final sale and cannot be returned for refund, but may be exchanged for store credit.",
    damaged_title: "Damaged or Defective Items",
    damaged_content: "If you receive a damaged or defective item, please contact us immediately. We will provide a prepaid return label and process your refund or replacement as soon as possible.",
    contact_title: "Contact Us",
    contact_content: "For questions about our refund policy or to initiate a return, please contact us at support@gemsutopia.com or call +1 (555) 123-4567."
  };

  // Use CMS content if available, otherwise fall back to defaults
  const getContent = (key: string): string => content[key] || defaultContent[key] || '';
  return (
    <div className="min-h-[200vh] flex flex-col relative">
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
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">{getContent('title')}</h1>
              <p className="text-lg text-neutral-600">{getContent('subtitle')}</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">{getContent('guarantee_title')}</h2>
                <p className="mb-4">
                  {getContent('guarantee_content')}
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">{getContent('process_title')}</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{getContent('process_item_1')}</li>
                  <li>{getContent('process_item_2')}</li>
                  <li>{getContent('process_item_3')}</li>
                  <li>{getContent('process_item_4')}</li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">{getContent('exceptions_title')}</h2>
                <p className="mb-4">
                  {getContent('exceptions_content')}
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">{getContent('damaged_title')}</h2>
                <p className="mb-4">
                  {getContent('damaged_content')}
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-black mb-4">{getContent('contact_title')}</h2>
                <p>
                  {getContent('contact_content')}
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