'use client';
import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Eye,
  ArrowUpRight
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
      icon: Eye,
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
      Promise.all([
        fetch('/api/orders'),
        fetch('/api/products?includeInactive=true', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      .then(responses => Promise.all(responses.map(res => res.json())))
      .then(([ordersData, productsData]) => {
        const orders = ordersData.orders || [];
        const products = productsData.products || [];
        
        // Calculate stats from real data
        const totalRevenue = orders.reduce((sum: number, order: any) => {
          const total = order.total || order.amount || '0';
          const amount = parseFloat(typeof total === 'string' ? total.replace(/[^0-9.-]+/g, '') : total.toString());
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const totalOrders = orders.length;
        const uniqueCustomers = new Set(orders.map((order: any) => order.customer)).size;
        const totalProducts = products.length;
        
        // Update metrics with live data
        setMetrics([
          {
            title: 'Total Revenue',
            value: `$${totalRevenue.toFixed(2)}`,
            change: 0,
            trend: 'up',
            icon: DollarSign,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20'
          },
          {
            title: 'Orders',
            value: totalOrders.toString(),
            change: 0,
            trend: 'up',
            icon: ShoppingCart,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20'
          },
          {
            title: 'Customers',
            value: uniqueCustomers.toString(),
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
            value: totalProducts.toString(),
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
            icon: Eye,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10 border-yellow-500/20'
          }
        ]);

        // Update recent orders (get last 5)
        setRecentOrders(orders.slice(0, 5).map((order: any) => ({
          id: order.id || '',
          status: order.status || '',
          customer: order.customer || '',
          amount: order.total || '',
          date: order.created_at || '',
          items: typeof order.items === 'string' ? order.items : '1 item'
        })));

        // Update quick stats
        setQuickStats({
          topProduct: orders.length > 0 ? 'Recent orders available' : 'No orders yet',
          conversionRate: '0%',
          newCustomers: `${uniqueCustomers} total`,
          stockStatus: 'All good'
        });

        setIsLoading(false);
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
            icon: Eye,
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

      {/* Key Metrics - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex items-center text-sm text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              Live
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[0]?.value || '$0.00'}</p>
            <p className="text-slate-400 text-sm">Total Revenue</p>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex items-center text-sm text-blue-400">
              <ArrowUpRight className="h-4 w-4" />
              Live
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[1]?.value || '0'}</p>
            <p className="text-slate-400 text-sm">Total Orders</p>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex items-center text-sm text-purple-400">
              <ArrowUpRight className="h-4 w-4" />
              Live
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[2]?.value || '0'}</p>
            <p className="text-slate-400 text-sm">Customers</p>
          </div>
        </div>

        {/* Products */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Package className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="flex items-center text-sm text-cyan-400">
              <Eye className="h-4 w-4" />
              Active
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[4]?.value || '0'}</p>
            <p className="text-slate-400 text-sm">Products</p>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-300">Orders API</span>
              </div>
              <span className="text-emerald-400 text-sm font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-300">Products API</span>
              </div>
              <span className="text-emerald-400 text-sm font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-slate-300">Database</span>
              </div>
              <span className="text-emerald-400 text-sm font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-slate-300">Stock Levels</span>
              </div>
              <span className="text-yellow-400 text-sm font-medium">{quickStats.stockStatus}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-colors">
              <Package className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 transition-colors">
              <Eye className="h-4 w-4" />
              <span>View Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <ShoppingCart className="h-4 w-4" />
              <span>Recent Orders</span>
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}