'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Quote as QuoteIcon } from 'lucide-react';

interface Quote {
  id: string;
  quote: string;
  author: string;
  gem_type: string;
  sort_order: number;
  is_active: boolean;
}

export default function Quote() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
        if (data.length > 0) {
          setCurrentQuote(data[Math.floor(Math.random() * data.length)]);
        }
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNewQuote = () => {
    if (quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setCurrentQuote(randomQuote);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!currentQuote) {
    return null;
  }

  return (
    <div className="text-center py-8">
      <h3 className="text-2xl font-bold text-black mb-6">Quote of the Day</h3>
      
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <QuoteIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        
        <blockquote className="text-lg text-gray-800 mb-4 italic leading-relaxed">
          "{currentQuote.quote}"
        </blockquote>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          {currentQuote.author && (
            <cite className="text-gray-600 not-italic">— {currentQuote.author}</cite>
          )}
          {currentQuote.gem_type && (
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
              {currentQuote.gem_type}
            </span>
          )}
        </div>
        
        <button
          onClick={getNewQuote}
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          New Quote
        </button>
      </div>
    </div>
  );
}