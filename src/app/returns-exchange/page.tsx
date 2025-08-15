'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ReturnsExchange() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/returns-exchange')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Returns & Exchange",
    subtitle: "We want you to love your gemstones",
    policy_title: "Our Return Policy",
    policy_intro: "At Gemsutopia, we want you to be completely satisfied with your purchase. If for any reason you're not happy with your gemstones, we offer a hassle-free return policy.",
    policy_window: "Return Window: You have 30 days from the date of delivery to return your items for a full refund or exchange.",
    acceptable_title: "What Can Be Returned",
    acceptable_intro: "We accept returns for:",
    acceptable_item_1: "Gemstones in their original condition",
    acceptable_item_2: "Jewelry pieces that haven't been resized or altered",
    acceptable_item_3: "Items that are unworn and undamaged",
    acceptable_item_4: "Products in their original packaging with all certificates",
    unacceptable_title: "Items We Cannot Accept",
    unacceptable_intro: "For hygiene and safety reasons, we cannot accept returns for:",
    unacceptable_item_1: "Custom or personalized jewelry pieces",
    unacceptable_item_2: "Items that have been resized or altered",
    unacceptable_item_3: "Gemstones that show signs of damage or wear",
    unacceptable_item_4: "Items without original packaging or certificates",
    return_steps_title: "How to Start a Return",
    return_steps_intro: "To initiate a return, please follow these simple steps:",
    return_step_1: "Contact us at gemsutopia@gmail.com with your order number",
    return_step_2: "Include photos of the item(s) you wish to return",
    return_step_3: "Specify the reason for return (exchange, refund, damaged, etc.)",
    return_step_4: "We'll provide you with return instructions and a return authorization number",
    return_step_5: "Package the items securely with all original materials",
    return_step_6: "Ship using a trackable method (we recommend insurance for valuable items)",
    exchange_title: "Exchange Process",
    exchange_intro: "If you'd like to exchange your item for a different size, style, or gemstone:",
    exchange_item_1: "Follow the return process above and specify \"exchange\" as your reason",
    exchange_item_2: "Let us know what you'd like to exchange it for",
    exchange_item_3: "We'll confirm availability and any price differences",
    exchange_item_4: "Upon receiving your return, we'll ship your new item",
    exchange_item_5: "If there's a price difference, we'll refund or charge accordingly",
    refund_title: "Refund Processing",
    refund_intro: "Once we receive and inspect your returned item:",
    refund_item_1: "We'll send you an email confirming receipt",
    refund_item_2: "Refunds are processed within 3-5 business days",
    refund_item_3: "Refunds are issued to your original payment method",
    refund_item_4: "You'll receive an email confirmation when the refund is processed",
    refund_item_5: "Please allow 5-10 business days for the refund to appear in your account",
    shipping_title: "Shipping Costs",
    shipping_returns: "Returns: Customers are responsible for return shipping costs unless the item was damaged or incorrectly sent.",
    shipping_exchanges: "Exchanges: We'll cover the cost of shipping your new item to you. You cover the return shipping cost.",
    shipping_damaged: "Damaged Items: If you received a damaged item, we'll provide a prepaid return label and cover all shipping costs.",
    damaged_title: "Damaged or Incorrect Items",
    damaged_intro: "If you received a damaged or incorrect item, please contact us immediately at gemsutopia@gmail.com. We'll make it right with:",
    damaged_item_1: "A full refund including original shipping costs",
    damaged_item_2: "A replacement item at no additional cost",
    damaged_item_3: "Prepaid return shipping labels",
    damaged_item_4: "Expedited processing of your replacement or refund",
    questions_title: "Questions?",
    questions_intro: "Our team is here to help make your return or exchange as smooth as possible. If you have any questions about our return policy, please don't hesitate to contact us at gemsutopia@gmail.com.",
    questions_response_time: "Response Time: We typically respond to all emails within 24 hours."
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
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('policy_title')}</h2>
              <p>
                {getContent('policy_intro')}
              </p>
              <p>
                <strong>{getContent('policy_window')}</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('acceptable_title')}</h2>
              <p>{getContent('acceptable_intro')}</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('acceptable_item_1')}</li>
                <li>{getContent('acceptable_item_2')}</li>
                <li>{getContent('acceptable_item_3')}</li>
                <li>{getContent('acceptable_item_4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('unacceptable_title')}</h2>
              <p>{getContent('unacceptable_intro')}</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('unacceptable_item_1')}</li>
                <li>{getContent('unacceptable_item_2')}</li>
                <li>{getContent('unacceptable_item_3')}</li>
                <li>{getContent('unacceptable_item_4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('return_steps_title')}</h2>
              <p>{getContent('return_steps_intro')}</p>
              <ol className="list-decimal ml-6 space-y-2">
                <li>{getContent('return_step_1')}</li>
                <li>{getContent('return_step_2')}</li>
                <li>{getContent('return_step_3')}</li>
                <li>{getContent('return_step_4')}</li>
                <li>{getContent('return_step_5')}</li>
                <li>{getContent('return_step_6')}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('exchange_title')}</h2>
              <p>
                {getContent('exchange_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('exchange_item_1')}</li>
                <li>{getContent('exchange_item_2')}</li>
                <li>{getContent('exchange_item_3')}</li>
                <li>{getContent('exchange_item_4')}</li>
                <li>{getContent('exchange_item_5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('refund_title')}</h2>
              <p>
                {getContent('refund_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('refund_item_1')}</li>
                <li>{getContent('refund_item_2')}</li>
                <li>{getContent('refund_item_3')}</li>
                <li>{getContent('refund_item_4')}</li>
                <li>{getContent('refund_item_5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('shipping_title')}</h2>
              <p>
                <strong>{getContent('shipping_returns')}</strong>
              </p>
              <p>
                <strong>{getContent('shipping_exchanges')}</strong>
              </p>
              <p>
                <strong>{getContent('shipping_damaged')}</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('damaged_title')}</h2>
              <p>
                {getContent('damaged_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('damaged_item_1')}</li>
                <li>{getContent('damaged_item_2')}</li>
                <li>{getContent('damaged_item_3')}</li>
                <li>{getContent('damaged_item_4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('questions_title')}</h2>
              <p>
                {getContent('questions_intro')}
              </p>
              <p>
                <strong>{getContent('questions_response_time')}</strong>
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