'use client';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchStats();
  }, []);

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

  const shouldCenter = stats.length <= 4;

  return (
    <div className="mt-16">
      {shouldCenter ? (
        // Centered layout for 4 or fewer items
        <div className="flex justify-center items-center gap-4 flex-wrap">
          {stats.map((stat) => {
            const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
            
            return (
              <div key={stat.id} className="flex-shrink-0">
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
      ) : (
        // Scrolling layout for more than 4 items
        <div className="overflow-hidden py-4">
          <div className="flex animate-[scroll-right_20s_linear_infinite] hover:[animation-play-state:paused]">
            {/* Triple the stats for seamless infinite scroll */}
            {stats.concat(stats).concat(stats).map((stat, index) => {
              const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
              
              return (
                <div key={`${stat.id}-${index}`} className="inline-block flex-shrink-0 mx-4">
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
      )}
      
      <style jsx global>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
}