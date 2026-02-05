'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconSearch, IconShoppingCart, IconExternalLink } from '@tabler/icons-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddressLine1: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  total: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  adminNotes: string | null;
  items: unknown[];
  itemCount: number;
  createdAt: string;
}

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const carrierOptions = ['canada_post', 'ups', 'fedex', 'purolator', 'other'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', carrier: '', adminNotes: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 25 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    params.set('page', String(pagination.page));

    try {
      const res = await fetch(`/api/orders?${params}`);
      const json = await res.json();
      setOrders(json.data || []);
      if (json.pagination) setPagination(json.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || '',
      adminNotes: order.adminNotes || '',
    });
    setDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm),
      });
      if (res.ok) {
        toast.success('Order updated');
        setDetailOpen(false);
        fetchOrders();
      }
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">{pagination.total} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {orders.map(order => (
            <button
              key={order.id}
              onClick={() => openDetail(order)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">#{order.orderNumber}</span>
                  <Badge variant="secondary" className={`text-[10px] ${statusColors[order.status] || ''}`}>
                    {order.status}
                  </Badge>
                  {order.paymentStatus === 'paid' && (
                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      paid
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.customerName || order.customerEmail} &middot; {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                <p className="text-xs text-muted-foreground">{order.itemCount || '?'} items</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground py-2">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button variant="outline" size="sm" disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
            Next
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-2">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-medium">{selectedOrder.customerName || 'N/A'}</p>
                  <p className="text-muted-foreground">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && <p className="text-muted-foreground">{selectedOrder.customerPhone}</p>}
                  {selectedOrder.shippingAddressLine1 && (
                    <p className="text-muted-foreground">
                      {selectedOrder.shippingAddressLine1}, {selectedOrder.shippingCity}, {selectedOrder.shippingProvince} {selectedOrder.shippingPostalCode}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(selectedOrder.shippingCost)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(selectedOrder.taxAmount)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
                  <p className="text-muted-foreground">Payment: {selectedOrder.paymentMethod || 'N/A'} ({selectedOrder.paymentStatus})</p>
                </CardContent>
              </Card>

              {/* Update Form */}
              <div className="space-y-3">
                <div>
                  <Label>Status</Label>
                  <Select value={updateForm.status} onValueChange={v => setUpdateForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tracking Number</Label>
                  <Input value={updateForm.trackingNumber} onChange={e => setUpdateForm(f => ({ ...f, trackingNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Carrier</Label>
                  <Select value={updateForm.carrier} onValueChange={v => setUpdateForm(f => ({ ...f, carrier: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                    <SelectContent>
                      {carrierOptions.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Admin Notes</Label>
                  <Textarea value={updateForm.adminNotes} onChange={e => setUpdateForm(f => ({ ...f, adminNotes: e.target.value }))} rows={2} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Update Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
