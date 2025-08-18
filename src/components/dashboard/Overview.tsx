'use client';
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Eye,
  Heart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MetricData {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ComponentType<Record<string, unknown>>;
  color: string;
  bgColor: string;
}

interface Order {
  id: string;
  status: string;
  customer: string;
  amount: string;
  date: string;
  items: string;
}

export default function Overview() {
  const [userInfo, setUserInfo] = useState({ name: 'Admin', email: '' });
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      title: 'Total Revenue',
      value: '$0.00',
      change: 0,
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Orders',
      value: '0',
      change: 0,
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Customers',
      value: '0',
      change: 0,
      trend: 'up',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Page Views',
      value: '0',
      change: 0,
      trend: 'up',
      icon: Eye,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20'
    },
    {
      title: 'Products',
      value: '0',
      change: 0,
      trend: 'up',
      icon: Package,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Conversion Rate',
      value: '0%',
      change: 0,
      trend: 'up',
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20'
    }
  ]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [quickStats, setQuickStats] = useState({
    topProduct: 'No orders yet',
    conversionRate: '0%',
    newCustomers: '0 this month',
    stockStatus: 'All good'
  });
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('admin-token');
    if (token) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.email) {
          const name = getUserNameFromEmail(data.email);
          setUserInfo({ name, email: data.email });
        }
      })
      .catch(() => {});

      // Fetch dashboard stats
      fetch('/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          const statsData = data.stats;
          setStats(statsData);
          
          // Update metrics with live data
          setMetrics([
            {
              title: 'Total Revenue',
              value: `$${statsData.totalRevenue.toFixed(2)}`,
              change: statsData.revenueChange,
              trend: statsData.revenueChange >= 0 ? 'up' : 'down',
              icon: DollarSign,
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500/10 border-emerald-500/20'
            },
            {
              title: 'Orders',
              value: statsData.totalOrders.toString(),
              change: statsData.ordersChange,
              trend: statsData.ordersChange >= 0 ? 'up' : 'down',
              icon: ShoppingCart,
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10 border-blue-500/20'
            },
            {
              title: 'Customers',
              value: statsData.totalCustomers.toString(),
              change: statsData.customersChange,
              trend: statsData.customersChange >= 0 ? 'up' : 'down',
              icon: Users,
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/10 border-purple-500/20'
            },
            {
              title: 'Page Views',
              value: statsData.pageViews.toLocaleString(),
              change: statsData.pageViewsChange,
              trend: statsData.pageViewsChange >= 0 ? 'up' : 'down',
              icon: Eye,
              color: 'text-orange-400',
              bgColor: 'bg-orange-500/10 border-orange-500/20'
            },
            {
              title: 'Products',
              value: statsData.totalProducts.toString(),
              change: statsData.productsChange,
              trend: statsData.productsChange >= 0 ? 'up' : 'down',
              icon: Package,
              color: 'text-cyan-400',
              bgColor: 'bg-cyan-500/10 border-cyan-500/20'
            },
            {
              title: 'Conversion Rate',
              value: `${statsData.conversionRate}%`,
              change: Math.abs(statsData.conversionRate),
              trend: 'up',
              icon: TrendingUp,
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/10 border-yellow-500/20'
            }
          ]);

          // Update recent orders
          setRecentOrders(statsData.recentOrders || []);

          // Update quick stats
          setQuickStats({
            topProduct: statsData.topProduct,
            conversionRate: `${statsData.conversionRate}%`,
            newCustomers: `${statsData.recentCustomers} this month`,
            stockStatus: statsData.stockStatus
          });

          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching dashboard stats:', error);
        // Fallback to default data if API fails
        setMetrics([
          {
            title: 'Total Revenue',
            value: '$0.00',
            change: 0,
            trend: 'up',
            icon: DollarSign,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20'
          },
          {
            title: 'Orders',
            value: '0',
            change: 0,
            trend: 'up',
            icon: ShoppingCart,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20'
          },
          {
            title: 'Customers',
            value: '0',
            change: 0,
            trend: 'up',
            icon: Users,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10 border-purple-500/20'
          },
          {
            title: 'Page Views',
            value: '0',
            change: 0,
            trend: 'up',
            icon: Eye,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10 border-orange-500/20'
          },
          {
            title: 'Products',
            value: '0',
            change: 0,
            trend: 'up',
            icon: Package,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10 border-cyan-500/20'
          },
          {
            title: 'Conversion Rate',
            value: '0%',
            change: 0,
            trend: 'up',
            icon: TrendingUp,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10 border-yellow-500/20'
          }
        ]);
        setQuickStats({
          topProduct: 'No orders yet',
          conversionRate: '0%',
          newCustomers: '0 this month',
          stockStatus: 'All good'
        });
        setIsLoading(false);
      });
    }
  }, []);

  const getUserNameFromEmail = (email: string): string => {
    switch (email) {
      case 'gemsutopia@gmail.com':
      case 'reeseroberge10@gmail.com':
        return 'Reese';
      case 'wilson.asher00@gmail.com':
        return 'Asher';
      default:
        return 'Admin';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'processing':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Loading dashboard stats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome back, {userInfo.name}! ✨
            </h1>
            <p className="text-slate-400">
              Here&apos;s what&apos;s happening with Gemsutopia today
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Today</p>
            <p className="text-xl font-semibold text-white">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.change > 0 ? ArrowUpRight : ArrowDownRight;
          
          return (
            <div
              key={index}
              className={`
                p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer
                ${metric.bgColor}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                  ${metric.change > 0 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-red-400 bg-red-500/10'
                  }
                `}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(metric.change)}%
                </div>
              </div>
              
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">
                  {metric.title}
                </h3>
                <p className="text-2xl font-bold text-white">
                  {metric.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Period Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today vs Yesterday */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Today vs Yesterday</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Revenue</span>
              <div className="text-right">
                <div className="text-white font-medium">${stats?.todayRevenue?.toFixed(2) || '0.00'}</div>
                <div className="text-slate-500 text-xs">vs ${stats?.yesterdayRevenue?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Orders</span>
              <div className="text-right">
                <div className="text-white font-medium">{stats?.todayOrders || 0}</div>
                <div className="text-slate-500 text-xs">vs {stats?.yesterdayOrders || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* This Week vs Last Week */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">This Week vs Last Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Revenue</span>
              <div className="text-right">
                <div className="text-white font-medium">${stats?.thisWeekRevenue?.toFixed(2) || '0.00'}</div>
                <div className="text-slate-500 text-xs">vs ${stats?.lastWeekRevenue?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Orders</span>
              <div className="text-right">
                <div className="text-white font-medium">{stats?.thisWeekOrders || 0}</div>
                <div className="text-slate-500 text-xs">vs {stats?.lastWeekOrders || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* This Month vs Last Month */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">This Month vs Last Month</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Revenue</span>
              <div className="text-right">
                <div className="text-white font-medium">${stats?.thisMonthRevenue?.toFixed(2) || '0.00'}</div>
                <div className="text-slate-500 text-xs">vs ${stats?.lastMonthRevenue?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Orders</span>
              <div className="text-right">
                <div className="text-white font-medium">{stats?.thisMonthOrders || 0}</div>
                <div className="text-slate-500 text-xs">vs {stats?.lastMonthOrders || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
            <button className="text-white hover:text-white/80 text-sm font-medium">
              View all →
            </button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-slate-500 mb-4" />
                <p className="text-slate-400 font-medium">No recent orders</p>
                <p className="text-sm text-slate-500">Orders will appear here once customers start purchasing</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-white">{order.id}</span>
                      <span className={`
                        px-2 py-1 rounded-lg text-xs font-medium border
                        ${getStatusColor(order.status)}
                      `}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{order.customer}</p>
                    <p className="text-sm text-slate-300">{order.items || 'Items'}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-white">{order.amount}</p>
                    <p className="text-xs text-slate-400">{order.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6">Quick Stats</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Heart className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-slate-300">Top Product</span>
              </div>
              <span className="text-white font-medium">{quickStats.topProduct}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-slate-300">Conversion Rate</span>
              </div>
              <span className="text-white font-medium">{quickStats.conversionRate}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-slate-300">New Customers</span>
              </div>
              <span className="text-white font-medium">{quickStats.newCustomers}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Package className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-slate-300">Stock Status</span>
              </div>
              <span className="text-white font-medium">{quickStats.stockStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}