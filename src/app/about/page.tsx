'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function About() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/about')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "About Gemsutopia",
    intro_paragraph: "First of all, thanks for stopping by — I'm Reese, founder of Gemsutopia and a proud Canadian gem dealer based in Alberta.",
    paragraph_1: "At Gemsutopia, we believe in gemstones with integrity. Every mineral and specimen you see in my shop is hand-selected, ethically sourced, and personally inspected by me. Many pieces — like our Blue Jay sapphires, Alberta peridot, and Canadian ammolite — were even mined by yours truly, straight from the earth with care and respect.",
    paragraph_2: "This isn't just a business — it's a passion. I don't list anything I wouldn't be proud to have in my own collection.",
    paragraph_3: "Each order is thoughtfully packed by my amazing spouse (she's the best), and we often include a small bonus gift as a thank-you for supporting our dream.",
    paragraph_4: "You can shop with confidence knowing we stand behind every piece, from quality to safe delivery.",
    shipping_title: "Shipping & Processing",
    shipping_item_1: "Processing time: 1–2 business days",
    shipping_item_2: "Estimated delivery (Canada): 3–15 business days (not guaranteed)",
    shipping_item_3: "Estimated delivery (USA): 5–20 business days (not guaranteed)",
    shipping_note: "Have a question or issue? Reach out anytime! I'll always do my best to help.",
    closing_paragraph: "Thanks so much for supporting Gemsutopia. You're not just buying a gem.. you're also investing in a story, a journey, and a small Canadian business that truly cares.",
    signature: "— Reese @ Gemsutopia"
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
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">{getContent('title')}</h1>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700">
              <p className="text-xl leading-relaxed mb-8">
                {getContent('intro_paragraph')}
              </p>
              
              <p className="mb-6">
                {getContent('paragraph_1')}
              </p>
              
              <p className="mb-6">
                {getContent('paragraph_2')}
              </p>
              
              <p className="mb-6">
                {getContent('paragraph_3')}
              </p>
              
              <p className="mb-8">
                {getContent('paragraph_4')}
              </p>
              
              <h2 className="text-2xl font-bold text-black mt-8 mb-4">{getContent('shipping_title')}</h2>
              <ul className="mb-6">
                <li>{getContent('shipping_item_1')}</li>
                <li>{getContent('shipping_item_2')}</li>
                <li>{getContent('shipping_item_3')}</li>
              </ul>
              
              <p className="mb-6">
                {getContent('shipping_note')}
              </p>
              
              <p className="text-xl leading-relaxed mb-8">
                {getContent('closing_paragraph')}
              </p>
              
              <p className="text-right font-semibold text-black">
                {getContent('signature')}
              </p>
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