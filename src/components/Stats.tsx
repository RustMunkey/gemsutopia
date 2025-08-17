'use client';
import { useState, useEffect, useRef } from 'react';
import { Users, Package, Calendar, Star, BarChart3, TrendingUp } from 'lucide-react';

interface Stat {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: string;
  data_source: string;
  is_real_time: boolean;
  sort_order: number;
  is_active: boolean;
}

const iconMap = {
  users: Users,
  package: Package,
  calendar: Calendar,
  star: Star,
  'bar-chart': BarChart3,
  'trending-up': TrendingUp,
};

export default function Stats() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  // Animation logic - EXACT copy of Reviews/Featured but reversed direction (right scroll)
  useEffect(() => {
    if (!isClient || stats.length <= 3 || !containerRef.current) return;
    
    let animationId: number;
    const startTime = performance.now();
    const container = containerRef.current;
    
    // Calculate dimensions
    const cardWidth = 236; // w-[220px] + mx-2 (16px margin) = 236px total width per card
    const oneSetWidth = stats.length * cardWidth;
    
    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const speed = 45; // pixels per second - same as reviews/featured
      const translateX = (elapsed * speed); // POSITIVE for rightward movement
      
      // Better normalization to prevent glitches - EXACT copy from reviews but reversed
      let normalizedTranslateX = 0;
      if (oneSetWidth > 0) {
        const rawMod = translateX % oneSetWidth;
        normalizedTranslateX = rawMod >= oneSetWidth ? rawMod - oneSetWidth : rawMod;
      }
      
      // Directly update the transform without causing React re-renders
      container.style.transform = `translate3d(${normalizedTranslateX}px, 0, 0)`;
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isClient, stats]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to default stats if API fails
      setStats([
        { id: '1', title: 'Happy Customers', value: '1000+', description: 'Satisfied customers across Canada', icon: 'users', data_source: 'manual', is_real_time: false, sort_order: 1, is_active: true },
        { id: '2', title: 'Products Sold', value: '500+', description: 'Premium gemstones delivered', icon: 'package', data_source: 'analytics', is_real_time: true, sort_order: 2, is_active: true },
        { id: '3', title: 'Years of Experience', value: '10+', description: 'Expertise in gemstone sourcing', icon: 'calendar', data_source: 'manual', is_real_time: false, sort_order: 3, is_active: true },
        { id: '4', title: 'Five Star Reviews', value: '98%', description: 'Customer satisfaction rating', icon: 'star', data_source: 'reviews', is_real_time: true, sort_order: 4, is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-16 overflow-hidden">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      {/* Stats Display - EXACT copy of Featured.tsx layout logic */}
      <div className="py-8">
        {(() => {
          const shouldCenter = stats.length <= 3;
          
          if (shouldCenter) {
            // Centered layout for 3 or fewer items
            return (
              <div className="flex justify-center items-stretch gap-4 flex-wrap max-w-6xl mx-auto px-4">
                {stats.map((stat) => {
                  const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
                  
                  return (
                    <div key={stat.id} className="flex-shrink-0 w-[220px]">
                      <div className="bg-black rounded-2xl px-6 py-6 shadow-lg w-[180px] h-[140px] flex flex-col justify-center">
                        <div className="text-center">
                          {IconComponent && (
                            <div className="flex justify-center mb-2">
                              <IconComponent className="h-6 w-6 text-white opacity-70" />
                            </div>
                          )}
                          <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {stat.value}
                          </div>
                          <div className="text-sm md:text-base text-white font-medium">
                            {stat.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // Scrolling layout for more than 3 items
            return (
              <div className="overflow-hidden py-8">
                <div 
                  ref={containerRef}
                  className="flex"
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  {stats.concat(stats).concat(stats).map((stat, index) => {
                    const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
                    
                    return (
                      <div key={`${stat.id}-${index}`} className="inline-block flex-shrink-0 w-[220px] mx-2">
                        <div className="bg-black rounded-2xl px-6 py-6 shadow-lg w-[180px] h-[140px] flex flex-col justify-center">
                          <div className="text-center">
                            {IconComponent && (
                              <div className="flex justify-center mb-2">
                                <IconComponent className="h-6 w-6 text-white opacity-70" />
                              </div>
                            )}
                            <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                              {stat.value}
                            </div>
                            <div className="text-sm md:text-base text-white font-medium">
                              {stat.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}