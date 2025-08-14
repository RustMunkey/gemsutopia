'use client';
import { useCMSContent } from '@/hooks/useCMSContent';
import Stats from './Stats';
import GemFacts from './GemFacts';

export default function About() {
  const { getContent, loading } = useCMSContent();
  
  const title = getContent('about', 'section_title') || '💎 About Gemsutopia 💎';
  const content = getContent('about', 'section_content') || "Hi, I'm Reese, founder of Gemsutopia and a proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally inspected by me. Many pieces are even mined by yours truly! This isn't just a business – it's a passion, and you're supporting a small Canadian dream built on integrity and care.";

  if (loading) {
    return (
      <section className="bg-black text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 bg-gradient-to-b from-black to-transparent text-white py-0 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-8">{title}</h2>
          <div 
            className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

      </div>

      {/* Statistics Scrolling Row - Full Width */}
      <Stats />
      
      {/* Gem Facts Section */}
      <GemFacts />
      
    </section>
  );
}