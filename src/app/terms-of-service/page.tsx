'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/terms-of-service')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Terms of Service",
    last_updated: "Last updated: January 2025",
    acceptance_title: "1. Acceptance of Terms",
    acceptance_content: "By accessing and using Gemsutopia's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
    products_title: "2. Products and Services",
    products_paragraph_1: "Gemsutopia offers premium gemstones and jewelry pieces, many of which are hand-mined and ethically sourced from Alberta, Canada. All product descriptions, images, and specifications are provided to the best of our knowledge and ability.",
    products_paragraph_2: "We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.",
    orders_title: "3. Orders and Payment",
    orders_paragraph_1: "By placing an order through our website, you are making an offer to purchase products subject to these terms. All orders are subject to availability and confirmation.",
    orders_paragraph_2: "Payment is required at the time of purchase. We accept major credit cards, PayPal, and other payment methods as displayed on our website. All prices are in Canadian dollars unless otherwise stated.",
    shipping_title: "4. Shipping and Delivery",
    shipping_paragraph_1: "Shipping times are estimates and may vary. We are not responsible for delays caused by shipping carriers, customs, or other factors beyond our control.",
    shipping_paragraph_2: "Risk of loss and title for items purchased from Gemsutopia pass to you upon delivery to the shipping carrier.",
    returns_title: "5. Returns and Refunds",
    returns_content: "Please contact us at gemsutopia@gmail.com for detailed information about returns, exchanges, and refunds. All returns must be authorized and comply with our return policy.",
    intellectual_title: "6. Intellectual Property",
    intellectual_content: "All content on this website, including text, graphics, logos, images, and software, is the property of Gemsutopia and is protected by copyright and other intellectual property laws.",
    liability_title: "7. Limitation of Liability",
    liability_content: "Gemsutopia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.",
    privacy_title: "8. Privacy",
    privacy_content: "Your privacy is important to us. Please refer to our Privacy Policy for information about how we collect, use, and protect your personal information.",
    contact_title: "9. Contact Information",
    contact_content: "If you have any questions about these Terms of Service, please contact us at gemsutopia@gmail.com.",
    changes_title: "10. Changes to Terms",
    changes_content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the service constitutes acceptance of the modified terms."
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
              <p className="text-lg text-neutral-600">{getContent('last_updated')}</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('acceptance_title')}</h2>
              <p>
                {getContent('acceptance_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('products_title')}</h2>
              <p>
                {getContent('products_paragraph_1')}
              </p>
              <p>
                {getContent('products_paragraph_2')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('orders_title')}</h2>
              <p>
                {getContent('orders_paragraph_1')}
              </p>
              <p>
                {getContent('orders_paragraph_2')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('shipping_title')}</h2>
              <p>
                {getContent('shipping_paragraph_1')}
              </p>
              <p>
                {getContent('shipping_paragraph_2')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('returns_title')}</h2>
              <p>
                {getContent('returns_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('intellectual_title')}</h2>
              <p>
                {getContent('intellectual_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('liability_title')}</h2>
              <p>
                {getContent('liability_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('privacy_title')}</h2>
              <p>
                {getContent('privacy_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('contact_title')}</h2>
              <p>
                {getContent('contact_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('changes_title')}</h2>
              <p>
                {getContent('changes_content')}
              </p>
            </section>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}