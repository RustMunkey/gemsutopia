'use client';
import { useState, useEffect } from 'react';
import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconUsers,
  IconPackage,
  IconEye,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { isTestOrder, PaymentDetails } from '@/lib/utils/orderUtils';
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
  customerEmail: string;
  customerName: string | null;
  total: string | null;
  subtotal?: string | null;
  shipping?: string | null;
  tax?: string | null;
  status: string | null;
  createdAt: string | null;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  paymentDetails?: PaymentDetails;
}

interface OverviewProps {
  onNavigateToProducts?: () => void;
  onNavigateToOrders?: () => void;
}

export default function Overview({ onNavigateToProducts, onNavigateToOrders }: OverviewProps) {
  const { mode } = useMode();
  const [userInfo, setUserInfo] = useState({ name: 'Admin', email: '' });
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      title: 'Total Revenue',
      value: '$0.00',
      change: 0,
      trend: 'up',
      icon: IconCurrencyDollar,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Orders',
      value: '0',
      change: 0,
      trend: 'up',
      icon: IconShoppingCart,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Customers',
      value: '0',
      change: 0,
      trend: 'up',
      icon: IconUsers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Page Views',
      value: '0',
      change: 0,
      trend: 'up',
      icon: IconEye,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Products',
      value: '0',
      change: 0,
      trend: 'up',
      icon: IconPackage,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Conversion Rate',
      value: '0%',
      change: 0,
      trend: 'up',
      icon: IconEye,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    },
  ]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [quickStats, setQuickStats] = useState({
    topProduct: 'No orders yet',
    conversionRate: '0%',
    newCustomers: '0 this month',
    stockStatus: 'All good',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('admin-token');
    if (token) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
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
        fetch(`/api/orders?mode=${mode}`).then(res => (res.ok ? res.json() : { orders: [] })),
        fetch('/api/products?includeInactive=true', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => (res.ok ? res.json() : { products: [] })),
      ])
        .then(([ordersData, productsData]) => {
          const orders = ordersData.orders || [];
          const products = productsData.products || [];

          // Orders are already filtered by backend based on mode
          const filteredOrders = orders;

          // Calculate stats from filtered orders
          const totalRevenue = filteredOrders.reduce((sum: number, order: any) => {
            const total = order.total || order.amount || '0';
            const amount = parseFloat(
              typeof total === 'string' ? total.replace(/[^0-9.-]+/g, '') : total.toString()
            );
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
              icon: IconCurrencyDollar,
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              title: 'Orders',
              value: totalOrders.toString(),
              change: 0,
              trend: 'up',
              icon: IconShoppingCart,
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10 border-blue-500/20',
            },
            {
              title: 'Customers',
              value: uniqueCustomers.toString(),
              change: 0,
              trend: 'up',
              icon: IconUsers,
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/10 border-purple-500/20',
            },
            {
              title: 'Page Views',
              value: '0',
              change: 0,
              trend: 'up',
              icon: IconEye,
              color: 'text-orange-400',
              bgColor: 'bg-orange-500/10 border-orange-500/20',
            },
            {
              title: 'Products',
              value: totalProducts.toString(),
              change: 0,
              trend: 'up',
              icon: IconPackage,
              color: 'text-cyan-400',
              bgColor: 'bg-cyan-500/10 border-cyan-500/20',
            },
            {
              title: 'Conversion Rate',
              value: '0%',
              change: 0,
              trend: 'up',
              icon: IconEye,
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/10 border-yellow-500/20',
            },
          ]);

          // Recent orders are now fetched separately

          // Update quick stats
          setQuickStats({
            topProduct: filteredOrders.length > 0 ? 'Recent orders available' : 'No orders yet',
            conversionRate: '0%',
            newCustomers: `${uniqueCustomers} total`,
            stockStatus: 'All good',
          });

          setIsLoading(false);
        })
        .catch(() => {
          // Fallback to default data if API fails
          setMetrics([
            {
              title: 'Total Revenue',
              value: '$0.00',
              change: 0,
              trend: 'up',
              icon: IconCurrencyDollar,
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              title: 'Orders',
              value: '0',
              change: 0,
              trend: 'up',
              icon: IconShoppingCart,
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10 border-blue-500/20',
            },
            {
              title: 'Customers',
              value: '0',
              change: 0,
              trend: 'up',
              icon: IconUsers,
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/10 border-purple-500/20',
            },
            {
              title: 'Page Views',
              value: '0',
              change: 0,
              trend: 'up',
              icon: IconEye,
              color: 'text-orange-400',
              bgColor: 'bg-orange-500/10 border-orange-500/20',
            },
            {
              title: 'Products',
              value: '0',
              change: 0,
              trend: 'up',
              icon: IconPackage,
              color: 'text-cyan-400',
              bgColor: 'bg-cyan-500/10 border-cyan-500/20',
            },
            {
              title: 'Conversion Rate',
              value: '0%',
              change: 0,
              trend: 'up',
              icon: IconEye,
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/10 border-yellow-500/20',
            },
          ]);
          setQuickStats({
            topProduct: 'No orders yet',
            conversionRate: '0%',
            newCustomers: '0 this month',
            stockStatus: 'All good',
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
      } catch {
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
      minute: '2-digit',
    });
  };

  const formatPaymentAmount = (order: Order) => {
    const pd = order.paymentDetails;
    const total = parseFloat(order.total || '0');

    if (pd?.method === 'crypto' && pd.crypto_amount && pd.crypto_currency) {
      return `${pd.crypto_amount.toFixed(6)} ${pd.crypto_currency}`;
    }

    return `$${total.toFixed(2)} ${pd?.currency || 'CAD'}`;
  };

  const getStatusColor = (status: string, isTest: boolean = false) => {
    if (isTest) {
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }

    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            <span className="ml-3 text-white">Loading dashboard stats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white">
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
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics - Simplified */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}
            >
              <IconCurrencyDollar
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'live' ? 'text-emerald-400' : 'text-orange-400'}`}
            >
              <IconArrowUpRight size={16} />
              {mode === 'live' ? 'Live' : 'Dev'}
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">{metrics[0]?.value || '$0.00'}</p>
            <p className="text-sm text-slate-400">Total Revenue</p>
          </div>
        </div>

        {/* Orders */}
        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}
            >
              <IconShoppingCart
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'live' ? 'text-blue-400' : 'text-orange-400'}`}
            >
              <IconArrowUpRight size={16} />
              {mode === 'live' ? 'Live' : 'Dev'}
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">{metrics[1]?.value || '0'}</p>
            <p className="text-sm text-slate-400">Total Orders</p>
          </div>
        </div>

        {/* Customers */}
        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-purple-500/20'}`}
            >
              <IconUsers
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'live' ? 'text-purple-400' : 'text-orange-400'}`}
            >
              <IconArrowUpRight size={16} />
              {mode === 'live' ? 'Live' : 'Dev'}
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">{metrics[2]?.value || '0'}</p>
            <p className="text-sm text-slate-400">Customers</p>
          </div>
        </div>

        {/* Products */}
        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-cyan-500/20'}`}
            >
              <IconPackage
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-cyan-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-cyan-400'}`}
            >
              <IconEye size={16} />
              Active
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">{metrics[4]?.value || '0'}</p>
            <p className="text-sm text-slate-400">Products</p>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Status */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                <span className="text-slate-300">Orders API</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                <span className="text-slate-300">Products API</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                <span className="text-slate-300">Database</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                <span className="text-slate-300">Stock Levels</span>
              </div>
              <span className="text-sm font-medium text-yellow-400">{quickStats.stockStatus}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={onNavigateToProducts}
              className={`flex w-full items-center gap-3 rounded-xl p-3 transition-colors ${
                mode === 'dev'
                  ? 'border border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                  : 'border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              <IconPackage size={16} />
              <span>Add New Product</span>
            </button>
            <button
              onClick={onNavigateToOrders}
              className={`flex w-full items-center gap-3 rounded-xl p-3 transition-colors ${
                mode === 'dev'
                  ? 'border border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                  : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <IconShoppingCart size={16} />
              <span>Recent Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
          <button
            onClick={onNavigateToOrders}
            className="text-sm font-medium text-white hover:text-white/80"
          >
            View all →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconShoppingCart size={48} className="mb-4 text-slate-500" />
            <p className="font-medium text-slate-400">No recent orders</p>
            <p className="text-sm text-slate-500">
              Orders will appear here once customers start purchasing
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-4 font-mono text-sm text-slate-300">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-sm text-slate-400">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">{formatPaymentAmount(order)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-medium ${getStatusColor(order.status || 'pending', isTestOrder(order))}`}
                      >
                        {isTestOrder(order) ? 'TEST' : (order.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatDate(order.createdAt || '')}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={onNavigateToOrders}
                        className="flex items-center gap-2 rounded bg-white/10 px-3 py-1 text-sm text-white transition-colors hover:bg-white/20"
                      >
                        <IconEye size={12} />
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
