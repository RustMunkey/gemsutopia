'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconPackage,
  IconUsers,
  IconGavel,
  IconClock,
  IconArrowUpRight,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface DashboardData {
  stats: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalOrders: number;
    recentOrders: number;
    totalProducts: number;
    totalCustomers: number;
    activeAuctions: number;
    pendingOrders: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerEmail: string;
    total: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    inventory: number;
    lowStockThreshold: number;
    images: string[];
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
}

function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(json => setData(json.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back</p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats?.monthlyRevenue || 0)} this month
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <IconCurrencyDollar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Orders</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.recentOrders || 0} this week
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <IconShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Products</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalProducts || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeAuctions || 0} active auctions
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <IconPackage className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customers</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalCustomers || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.pendingOrders || 0} pending orders
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <IconUsers className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Link href="/products?action=new" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium">
          <IconPackage className="h-4 w-4 text-muted-foreground" />
          Add Product
          <IconArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
        </Link>
        <Link href="/auctions?action=new" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium">
          <IconGavel className="h-4 w-4 text-muted-foreground" />
          New Auction
          <IconArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
        </Link>
        <Link href="/orders" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium">
          <IconClock className="h-4 w-4 text-muted-foreground" />
          Pending Orders
          <IconArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
        </Link>
        <Link href="/customers" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium">
          <IconUsers className="h-4 w-4 text-muted-foreground" />
          Customers
          <IconArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
        </Link>
      </div>

      {/* Two column layout */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Link href="/orders" className="text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {data.recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.customerName || order.customerEmail}</p>
                      <p className="text-xs text-muted-foreground">#{order.orderNumber} &middot; {timeAgo(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[order.status] || ''}`}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-medium whitespace-nowrap">{formatCurrency(parseFloat(order.total))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Low Stock Alerts</CardTitle>
              <Link href="/products" className="text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {data.lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <IconPackage className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Threshold: {product.lowStockThreshold}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconAlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {product.inventory}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">All products well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
