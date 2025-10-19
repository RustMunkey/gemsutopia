'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export default function FAQ() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const response = await fetch('/api/faq');
      if (response.ok) {
        const data = await response.json();
        setFaqItems(data);
      }
    } catch (error) {
      console.error('Error fetching FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    if (openItems.has(id)) {
      // Close the currently open item
      setOpenItems(new Set());
    } else {
      // Close all items and open only the clicked one
      setOpenItems(new Set([id]));
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (faqItems.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1">
        <div className="w-full flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-4">
          <div className="w-full lg:w-1/2">
            <div className="mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Frequently Asked Questions</h2>
            </div>
            <p className="text-lg text-white max-w-xl drop-shadow-lg">
              Find answers to common questions about our gemstones, shipping, and services
            </p>
          </div>

          <div className="space-y-4 w-full lg:w-[600px] pr-0 lg:ml-auto">
          {faqItems.slice(0, 4).map((item) => {
            const isOpen = openItems.has(item.id);
            
            return (
              <div key={item.id} className="rounded-lg overflow-hidden bg-black/80 backdrop-blur-md">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left hover:bg-white/10 transition-colors duration-200 flex items-center justify-between"
                >
                  <span className="text-lg font-medium text-white pr-4">
                    {item.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-white flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-white flex-shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-4 bg-white/5">
                    <div className="pt-2">
                      <p className="text-white/80 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-white">
            Still have questions?{' '}
            <a
              href="mailto:support@gemsutopia.com"
              className="text-white font-medium hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}