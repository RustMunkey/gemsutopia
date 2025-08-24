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
        // Use all stats from backend (up to 6 for optimal display)
        setStats(data.slice(0, 6));
      } else {
        console.error('API response not ok:', response.status, response.statusText);
        throw new Error('Failed to fetch from API');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Only use fallback stats if API completely fails
      setStats([
        { id: '1', title: 'Happy Customers', value: '1000+', description: 'Satisfied customers across Canada', icon: 'users', data_source: 'manual', is_real_time: false, sort_order: 1, is_active: true },
        { id: '2', title: 'Products Sold', value: '500+', description: 'Premium gemstones delivered', icon: 'package', data_source: 'analytics', is_real_time: true, sort_order: 2, is_active: true },
        { id: '3', title: 'Years of Experience', value: '10+', description: 'Expertise in gemstone sourcing', icon: 'calendar', data_source: 'manual', is_real_time: false, sort_order: 3, is_active: true },
        { id: '4', title: 'Five Star Reviews', value: '98%', description: 'Customer satisfaction rating', icon: 'star', data_source: 'reviews', is_real_time: true, sort_order: 4, is_active: true },
        { id: '5', title: 'Countries Served', value: '5+', description: 'International shipping', icon: 'trending-up', data_source: 'manual', is_real_time: false, sort_order: 5, is_active: true },
        { id: '6', title: 'Gemstone Types', value: '25+', description: 'Variety of precious stones', icon: 'bar-chart', data_source: 'manual', is_real_time: false, sort_order: 6, is_active: true }
      ].slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 bg-black">
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
    <div className="w-full py-6 bg-black">
      {/* Mobile: Card format */}
      <div className="lg:hidden px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="grid grid-cols-3 gap-x-4 gap-y-6">
            {stats.slice(0, 6).map((stat) => {
              const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
              
              return (
                <div key={stat.id} className="text-center">
                  <div className="flex justify-center mb-2">
                    {IconComponent && (
                      <IconComponent className="h-5 w-5 text-white opacity-80" />
                    )}
                  </div>
                  <div className="text-lg font-bold text-white mb-1 leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/90 font-medium leading-tight">
                    {stat.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Horizontal line format */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-4 px-12">
          {stats.map((stat) => {
            const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
            
            return (
              <div key={stat.id} className="text-center">
                <div className="flex justify-center mb-1">
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 text-white opacity-80" />
                  )}
                </div>
                <div className="text-lg font-bold text-white mb-0.5 leading-none">
                  {stat.value}
                </div>
                <div className="text-xs text-white/90 font-medium leading-tight">
                  {stat.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}