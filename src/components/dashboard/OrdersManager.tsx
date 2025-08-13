'use client';
import { useState, useEffect } from 'react';
import { Package, DollarSign, User, Calendar, Eye, Download } from 'lucide-react';

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
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
  };
}

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const exportOrders = () => {
    const csvContent = [
      ['Date', 'Order ID', 'Customer', 'Email', 'Total', 'Status', 'Payment Method', 'Payment ID'].join(','),
      ...orders.map(order => [
        new Date(order.created_at).toISOString().split('T')[0],
        order.id,
        `"${order.customer_name}"`,
        order.customer_email,
        order.total.toFixed(2),
        order.status,
        order.payment_details.method,
        order.payment_details.payment_id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-slate-400">Manage customer orders and payments</p>
        </div>
        <button
          onClick={exportOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-slate-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-black rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-black rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-slate-400 text-sm">Unique Customers</p>
              <p className="text-2xl font-bold text-white">
                {new Set(orders.map(order => order.customer_email)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-black rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-slate-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter(order => 
                  new Date(order.created_at).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-black rounded-lg border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/20">
              <tr>
                <th className="text-left py-4 px-6 text-white font-medium">Order ID</th>
                <th className="text-left py-4 px-6 text-white font-medium">Customer</th>
                <th className="text-left py-4 px-6 text-white font-medium">Total</th>
                <th className="text-left py-4 px-6 text-white font-medium">Status</th>
                <th className="text-left py-4 px-6 text-white font-medium">Date</th>
                <th className="text-left py-4 px-6 text-white font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 px-6 text-slate-300 font-mono text-sm">
                    #{order.id.slice(-8)}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-white font-medium">{order.customer_name}</p>
                      <p className="text-slate-400 text-sm">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white font-semibold">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedOrder(order)}
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
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/20 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Order #{selectedOrder.id.slice(-8)}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Customer Information</h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <p className="text-white"><strong>Name:</strong> {selectedOrder.customer_name}</p>
                  <p className="text-white"><strong>Email:</strong> {selectedOrder.customer_email}</p>
                  <p className="text-white"><strong>Date:</strong> {formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Payment Information</h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <p className="text-white"><strong>Method:</strong> {selectedOrder.payment_details.method}</p>
                  <p className="text-white"><strong>Payment ID:</strong> {selectedOrder.payment_details.payment_id}</p>
                  <p className="text-white"><strong>Amount:</strong> ${selectedOrder.payment_details.amount.toFixed(2)}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-slate-400 text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-white font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-white font-bold">
                    <span>Total: ${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}