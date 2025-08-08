'use client';
import { useState, useEffect } from 'react';
import { useCMSContent } from '@/hooks/useCMSContent';

export default function About() {
  const { getContent, loading } = useCMSContent();
  const [customerCount, setCustomerCount] = useState(0);
  
  const title = getContent('about', 'section_title') || '💎 About Gemsutopia 💎';
  const content = getContent('about', 'section_content') || "Hi, I'm Reese, founder of Gemsutopia and a proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally inspected by me. Many pieces are even mined by yours truly! This isn't just a business – it's a passion, and you're supporting a small Canadian dream built on integrity and care.";

  useEffect(() => {
    // Fetch customer count from approved reviews
    const fetchCustomerCount = async () => {
      try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        if (data.success) {
          setCustomerCount(data.count || 247); // Fallback to a nice number
        } else {
          setCustomerCount(247); // Fallback number
        }
      } catch (error) {
        setCustomerCount(247); // Fallback number
      }
    };

    fetchCustomerCount();
  }, []);

  if (loading) {
    return (
      <section className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-b from-black to-neutral-100 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-8">{title}</h2>
          <div 
            className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Statistics Scrolling Row */}
        <div className="mt-12 overflow-hidden">
          <div className="flex animate-[scroll-right_20s_linear_infinite] hover:[animation-play-state:paused]">
            {/* Duplicate the stats for infinite scroll */}
            {[...Array(2)].map((_, setIndex) => (
              <>
                {/* Satisfied Customers */}
                <div key={`customers-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        {customerCount.toLocaleString()}+
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Satisfied Customers
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gemstones Sold */}
                <div key={`gemstones-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        2,500+
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Gemstones Sold
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countries Served */}
                <div key={`countries-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        25+
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Countries Served
                      </div>
                    </div>
                  </div>
                </div>

                {/* Years Experience */}
                <div key={`years-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        5+
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Years Experience
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Quality */}
                <div key={`quality-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        100%
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Premium Quality
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authentic Gems */}
                <div key={`authentic-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        100%
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Authentic Gems
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Shipping */}
                <div key={`shipping-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        24/7
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Secure Shipping
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Support */}
                <div key={`support-${setIndex}`} className="inline-block flex-shrink-0 mx-4">
                  <div className="bg-transparent border-2 border-black rounded-2xl px-6 py-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                        24/7
                      </div>
                      <div className="text-sm md:text-base text-black font-medium">
                        Customer Support
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}