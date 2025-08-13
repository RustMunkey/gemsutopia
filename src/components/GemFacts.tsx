'use client';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface GemFact {
  id: string;
  fact: string;
  gem_type: string;
  source: string;
  is_active: boolean;
}

export default function GemFacts() {
  const [gemFact, setGemFact] = useState<GemFact | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchDate, setLastFetchDate] = useState<string>('');

  const fetchFactOfTheDay = async () => {
    try {
      const response = await fetch('/api/gem-facts');
      if (response.ok) {
        const data = await response.json();
        setGemFact(data);
        setLastFetchDate(new Date().toDateString());
        // Store in localStorage for persistence
        localStorage.setItem('gemFactOfTheDay', JSON.stringify(data));
        localStorage.setItem('gemFactDate', new Date().toDateString());
      }
    } catch (error) {
      console.error('Error fetching gem fact:', error);
      // Fallback fact
      setGemFact({
        id: 'fallback',
        fact: 'Gems have fascinated humans for thousands of years with their beauty and rarity.',
        gem_type: 'General',
        source: 'Default',
        is_active: true
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check if we have a cached fact for today
    const cachedFact = localStorage.getItem('gemFactOfTheDay');
    const cachedDate = localStorage.getItem('gemFactDate');
    const today = new Date().toDateString();

    if (cachedFact && cachedDate === today) {
      // Use cached fact for today
      setGemFact(JSON.parse(cachedFact));
      setLastFetchDate(cachedDate);
      setLoading(false);
    } else {
      // Fetch new fact for today
      fetchFactOfTheDay();
    }

    // Set up interval to check for new day every hour
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastFetchDate) {
        fetchFactOfTheDay();
      }
    }, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, [lastFetchDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFactOfTheDay();
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!gemFact) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Gem Fact of the Day</h2>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/10">
            <div className="mb-4">
              <span className="inline-block bg-white/10 text-white px-3 py-1 rounded-full text-sm font-medium">
                {gemFact.gem_type || 'General'}
              </span>
            </div>
            
            <p className="text-lg md:text-xl text-white leading-relaxed">
              {gemFact.fact}
            </p>
          </div>
          
          <div className="text-center mt-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-white hover:text-gray-300 transition-colors duration-200 hover:bg-white/10 rounded-lg"
              title="Get new fact"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}