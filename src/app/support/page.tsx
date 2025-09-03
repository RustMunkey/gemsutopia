'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Clock, CircleAlert } from 'lucide-react';

export default function Support() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/support')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Support Center",
    subtitle: "We're here to help you with any questions",
    email_support_title: "Email Support",
    email_support_description: "Get help via email",
    email_address: "gemsutopia@gmail.com",
    response_time_title: "Response Time",
    response_time_description: "We typically respond within",
    response_time_value: "24 hours",
    faq_title: "FAQ",
    faq_description: "Your questions answered",
    faq_section_title: "Frequently Asked Questions",
    faq_1_question: "How do I track my order?",
    faq_1_answer: "Once your order is shipped, you'll receive a tracking number via email. You can use this number to track your package on our shipping partner's website.",
    faq_2_question: "What is your return policy?",
    faq_2_answer: "We offer a 30-day return policy for all items in original condition. Please contact us at gemsutopia@gmail.com for detailed return information.",
    faq_3_question: "Are your gemstones authentic?",
    faq_3_answer: "Yes, all our gemstones come with certificates of authenticity and are sourced from trusted suppliers worldwide.",
    faq_4_question: "How long does shipping take?",
    faq_4_answer: "Standard shipping takes 3-5 business days. Express shipping options are available at checkout for faster delivery."
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
      
      <div className="relative z-10">
        <Header />
      </div>
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12 md:mb-20">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">{getContent('title')}</h1>
              <p className="text-lg text-neutral-600">{getContent('subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <Mail className="h-12 w-12 text-black mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">{getContent('email_support_title')}</h3>
                <p className="text-neutral-600 mb-4">{getContent('email_support_description')}</p>
                <a href={`mailto:${getContent('email_address')}`} className="text-black font-semibold hover:underline">
                  {getContent('email_address')}
                </a>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <Clock className="h-12 w-12 text-black mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">{getContent('response_time_title')}</h3>
                <p className="text-neutral-600 mb-4">{getContent('response_time_description')}</p>
                <p className="text-black font-semibold">{getContent('response_time_value')}</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <CircleAlert className="h-12 w-12 text-black mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">{getContent('faq_title')}</h3>
                <p className="text-neutral-600 mb-4">{getContent('faq_description')}</p>
                <a href="#faq" className="text-black font-semibold hover:underline">
                  View FAQ
                </a>
              </div>
            </div>
            
            <div id="faq">
              <h2 className="text-2xl font-bold text-black mb-8 text-center">{getContent('faq_section_title')}</h2>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-black mb-3">{getContent('faq_1_question')}</h3>
                  <p className="text-neutral-600">
                    {getContent('faq_1_answer')}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-black mb-3">{getContent('faq_2_question')}</h3>
                  <p className="text-neutral-600">
                    {getContent('faq_2_answer')}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-black mb-3">{getContent('faq_3_question')}</h3>
                  <p className="text-neutral-600">
                    {getContent('faq_3_answer')}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-black mb-3">{getContent('faq_4_question')}</h3>
                  <p className="text-neutral-600">
                    {getContent('faq_4_answer')}
                  </p>
                </div>
              </div>
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