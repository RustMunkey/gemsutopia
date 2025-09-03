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
import { isTestOrder } from '@/lib/utils/orderUtils';
import { useMode } from '@/lib/contexts/ModeContext';

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
  customer_email: string;
  customer_name: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  status: string;
  created_at: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  payment_details: {
    method: string;
    payment_id: string;
    amount: number;
    currency?: string;
    crypto_type?: string;
    crypto_amount?: number;
    crypto_currency?: string;
    wallet_address?: string;
    network?: string;
  };
}

interface OverviewProps {
  onNavigateToProducts?: () => void;
  onNavigateToOrders?: () => void;
}

export default function Overview({ 
  onNavigateToProducts, 
  onNavigateToOrders 
}: OverviewProps) {
  const { mode } = useMode();
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
        fetch(`/api/orders?mode=${mode}`).then(res => res.ok ? res.json() : { orders: [] }),
        fetch('/api/products?includeInactive=true', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { products: [] })
      ])
      .then(([ordersData, productsData]) => {
        const orders = ordersData.orders || [];
        const products = productsData.products || [];
        
        // Orders are already filtered by backend based on mode
        const filteredOrders = orders;
        
        // Calculate stats from filtered orders
        const totalRevenue = filteredOrders.reduce((sum: number, order: any) => {
          const total = order.total || order.amount || '0';
          const amount = parseFloat(typeof total === 'string' ? total.replace(/[^0-9.-]+/g, '') : total.toString());
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const totalOrders = filteredOrders.length;
        const uniqueCustomers = new Set(filteredOrders.map((order: any) => order.customer)).size;
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

        // Recent orders are now fetched separately

        // Update quick stats
        setQuickStats({
          topProduct: filteredOrders.length > 0 ? 'Recent orders available' : 'No orders yet',
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
  }, [mode]);

  // Fetch real orders for Recent Orders section
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await fetch(`/api/orders?mode=${mode}&limit=5`);
        const data = await response.json();
        if (data.orders) {
          setRecentOrders(data.orders);
        } else {
          setRecentOrders([]);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
        setRecentOrders([]);
      }
    };

    fetchRecentOrders();
  }, [mode]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPaymentAmount = (order: Order) => {
    const { payment_details } = order;
    
    if (payment_details.method === 'crypto' && payment_details.crypto_amount && payment_details.crypto_currency) {
      return `${payment_details.crypto_amount.toFixed(6)} ${payment_details.crypto_currency}`;
    }
    
    return `$${order.total.toFixed(2)} ${payment_details.currency || 'CAD'}`;
  };

  const getStatusColor = (status: string, isTest: boolean = false) => {
    if (isTest) {
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
    
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
              <DollarSign className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'live' ? 'text-emerald-400' : 'text-orange-400'}`}>
              <ArrowUpRight className="h-4 w-4" />
              {mode === 'live' ? 'Live' : 'Dev'}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[0]?.value || '$0.00'}</p>
            <p className="text-slate-400 text-sm">Total Revenue</p>
          </div>
        </div>

        {/* Orders */}
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              <ShoppingCart className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'live' ? 'text-blue-400' : 'text-orange-400'}`}>
              <ArrowUpRight className="h-4 w-4" />
              {mode === 'live' ? 'Live' : 'Dev'}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[1]?.value || '0'}</p>
            <p className="text-slate-400 text-sm">Total Orders</p>
          </div>
        </div>

        {/* Customers */}
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-purple-500/20'}`}>
              <Users className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'live' ? 'text-purple-400' : 'text-orange-400'}`}>
              <ArrowUpRight className="h-4 w-4" />
              {mode === 'live' ? 'Live' : 'Dev'}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{metrics[2]?.value || '0'}</p>
            <p className="text-slate-400 text-sm">Customers</p>
          </div>
        </div>

        {/* Products */}
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-cyan-500/20'}`}>
              <Package className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-cyan-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-cyan-400'}`}>
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
            <button 
              onClick={onNavigateToProducts}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                mode === 'dev' 
                  ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20' 
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
            <button 
              onClick={onNavigateToOrders}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                mode === 'dev' 
                  ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20' 
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
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
          <button 
            onClick={onNavigateToOrders}
            className="text-white hover:text-white/80 text-sm font-medium"
          >
            View all →
          </button>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400 font-medium">No recent orders</p>
            <p className="text-sm text-slate-500">Orders will appear here once customers start purchasing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4 text-slate-300 font-mono text-sm">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{order.customer_name}</p>
                        <p className="text-slate-400 text-sm">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {formatPaymentAmount(order)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status, isTestOrder(order))}`}>
                        {isTestOrder(order) ? 'TEST' : order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={onNavigateToOrders}
                        className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}