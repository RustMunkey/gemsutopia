'use client';
import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = [
    {
      question: "Are your gemstones authentic?",
      answer: "Yes, all our gemstones are 100% authentic and sourced directly from trusted suppliers. Each purchase comes with a certificate of authenticity."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for all items. Items must be returned in original condition with all packaging and certificates."
    },
    {
      question: "How long does shipping take?",
      answer: "We offer free worldwide shipping. Delivery typically takes 3-5 business days for domestic orders and 7-14 days for international orders."
    },
    {
      question: "How should I care for my gemstones?",
      answer: "Clean your gemstones with warm soapy water and a soft brush. Avoid harsh chemicals and store them separately to prevent scratching."
    }
  ];

  return (
    <section className="relative z-10 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Find answers to common questions about our gemstones and services
          </p>
        </div>
        
        <div className="space-y-4 py-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-neutral-200 rounded-2xl overflow-hidden drop-shadow-lg">
              <button
                className="w-full text-left p-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors flex justify-between items-center"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-black text-lg">{faq.question}</span>
                <span className="text-neutral-400 text-2xl font-light">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 bg-white/70 backdrop-blur-sm">
                  <p className="text-neutral-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}