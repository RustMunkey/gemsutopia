'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconUsers,
  IconChartBar,
} from '@tabler/icons-react';

interface ReportData {
  period: string;
  startDate: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  newCustomers: number;
  topProducts: Array<{ name: string; count: string; revenue: string }>;
  ordersByStatus: Array<{ status: string; count: string }>;
  paymentMethods: Array<{ method: string | null; count: string; total: string }>;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(v);
}

const periods = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'quarterly', label: 'This Quarter' },
  { key: 'annual', label: 'This Year' },
];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      const json = await res.json();
      setData(json.data);
    } catch {}
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div><h1 className="text-2xl font-bold">Reports</h1></div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Analytics and performance metrics</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 flex-wrap">
        {periods.map(p => (
          <Button key={p.key} variant={period === p.key ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p.key)}>
            {p.label}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data?.revenue || 0)}</p>
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
                <p className="text-xs text-muted-foreground uppercase font-medium">Orders</p>
                <p className="text-2xl font-bold mt-1">{data?.orderCount || 0}</p>
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
                <p className="text-xs text-muted-foreground uppercase font-medium">Avg Order</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data?.avgOrderValue || 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <IconChartBar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">New Customers</p>
                <p className="text-2xl font-bold mt-1">{data?.newCustomers || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <IconUsers className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="space-y-2">
                {data.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {product.count} sold &middot; {formatCurrency(parseFloat(product.revenue))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No sales data</p>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data?.ordersByStatus && data.ordersByStatus.length > 0 ? (
              <div className="space-y-2">
                {data.ordersByStatus.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data?.paymentMethods && data.paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {data.paymentMethods.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm capitalize">{item.method || 'Unknown'}</span>
                    <div className="text-right text-xs text-muted-foreground">
                      {item.count} orders &middot; {formatCurrency(parseFloat(item.total))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
