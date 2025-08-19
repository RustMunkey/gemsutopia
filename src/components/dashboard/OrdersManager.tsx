'use client';
import { useState, useEffect } from 'react';
import { Package, DollarSign, User, Calendar, Eye, Download, Trash2 } from 'lucide-react';
import { isTestOrder, filterOrdersByMode } from '@/lib/utils/orderUtils';
import { useMode } from '@/lib/contexts/ModeContext';

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


export default function OrdersManager() {
  const { mode } = useMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [mode]);

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

  const formatPaymentAmount = (order: Order) => {
    const { payment_details } = order;
    
    if (payment_details.method === 'crypto' && payment_details.crypto_amount && payment_details.crypto_currency) {
      return (
        <div>
          <div className="text-white font-semibold">
            {payment_details.crypto_amount.toFixed(6)} {payment_details.crypto_currency}
          </div>
          <div className="text-slate-400 text-xs">
            ${order.total.toFixed(2)} {payment_details.currency || 'CAD'}
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-white font-semibold">
        ${order.total.toFixed(2)} {payment_details.currency || 'CAD'}
      </div>
    );
  };

  const deleteTestOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this test order? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`
        }
      });
      
      if (response.ok) {
        fetchOrders(); // Refresh the orders list
      } else {
        console.error('Failed to delete test order:', response.status);
        alert('Failed to delete test order. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting test order:', error);
      alert('Error deleting test order. Please try again.');
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
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Orders ✨</h1>
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              <Package className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'live' ? 'text-blue-400' : 'text-orange-400'}`}>
              <Eye className="h-4 w-4" />
              <span className="ml-1">{mode === 'live' ? 'Live' : 'Dev'}</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{filterOrdersByMode(orders, mode).length}</p>
            <p className="text-slate-400 text-sm">Total Orders</p>
          </div>
        </div>
        
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
              <DollarSign className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`}>
              <DollarSign className="h-4 w-4" />
              <span className="ml-1">Revenue</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">
              ${filterOrdersByMode(orders, mode).reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </p>
            <p className="text-slate-400 text-sm">Total Revenue</p>
          </div>
        </div>
        
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-purple-500/20'}`}>
              <User className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}`}>
              <User className="h-4 w-4" />
              <span className="ml-1">Unique</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">
              {new Set(filterOrdersByMode(orders, mode).map(order => order.customer_email)).size}
            </p>
            <p className="text-slate-400 text-sm">Unique Customers</p>
          </div>
        </div>
        
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
              <Calendar className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`}>
              <Calendar className="h-4 w-4" />
              <span className="ml-1">Month</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">
              {filterOrdersByMode(orders, mode).filter(order => 
                new Date(order.created_at).getMonth() === new Date().getMonth()
              ).length}
            </p>
            <p className="text-slate-400 text-sm">This Month</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-black rounded-2xl border border-white/20 overflow-hidden">
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
              {filterOrdersByMode(orders, mode).map((order) => (
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
                  <td className="py-4 px-6">
                    {formatPaymentAmount(order)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status, isTestOrder(order))}`}>
                      {isTestOrder(order) ? 'TEST' : order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      {isTestOrder(order) && (
                        <button
                          onClick={() => deleteTestOrder(order.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete test order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
          <div className="bg-black border border-white/20 rounded-lg p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Receipt Header */}
            <div className="text-center mb-8">
              <div className="flex justify-between items-start mb-4">
                <div></div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Order Receipt</h2>
                  <p className="text-slate-400">Gemsutopia Admin Dashboard</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Order Details */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Order Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Number:</span>
                    <span className="font-mono text-sm text-white">{selectedOrder.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-white">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedOrder.status, isTestOrder(selectedOrder))}`}>
                      {isTestOrder(selectedOrder) ? 'TEST' : selectedOrder.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="border-t border-white/20 pt-3 mt-4">
                    <h4 className="text-white font-medium mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-white"><strong>Name:</strong> {selectedOrder.customer_name}</p>
                      <p className="text-white"><strong>Email:</strong> {selectedOrder.customer_email}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t border-white/20 pt-3 mt-4">
                    <h4 className="text-white font-medium mb-2">Payment Information</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-white"><strong>Method:</strong> {selectedOrder.payment_details.method}</p>
                      <p className="text-white"><strong>Payment ID:</strong> 
                        <span className="font-mono text-xs ml-2 break-all">
                          {selectedOrder.payment_details.payment_id}
                        </span>
                      </p>
                      
                      {selectedOrder.payment_details.method === 'crypto' && (
                        <>
                          <p className="text-white"><strong>Crypto Type:</strong> {selectedOrder.payment_details.crypto_currency}</p>
                          <p className="text-white"><strong>Network:</strong> {selectedOrder.payment_details.network}</p>
                          {selectedOrder.payment_details.wallet_address && (
                            <p className="text-white">
                              <strong>Wallet:</strong> 
                              <span className="font-mono text-xs ml-2">
                                {selectedOrder.payment_details.wallet_address.slice(0, 8)}...{selectedOrder.payment_details.wallet_address.slice(-6)}
                              </span>
                            </p>
                          )}
                          {selectedOrder.payment_details.crypto_currency === 'SOL' && (
                            <p className="text-white">
                              <strong>Explorer:</strong> 
                              <a 
                                href={`https://explorer.solana.com/tx/${selectedOrder.payment_details.payment_id}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline ml-2 text-xs"
                              >
                                View Transaction
                              </a>
                            </p>
                          )}
                          {selectedOrder.payment_details.crypto_currency === 'ETH' && (
                            <p className="text-white">
                              <strong>Explorer:</strong> 
                              <a 
                                href={`https://sepolia.etherscan.io/tx/${selectedOrder.payment_details.payment_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline ml-2 text-xs"
                              >
                                View Transaction
                              </a>
                            </p>
                          )}
                          {selectedOrder.payment_details.crypto_currency === 'BTC' && (
                            <p className="text-white">
                              <strong>Explorer:</strong> 
                              <a 
                                href={`https://blockstream.info/testnet/tx/${selectedOrder.payment_details.payment_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline ml-2 text-xs"
                              >
                                View Transaction
                              </a>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Breakdown */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Order Breakdown</h3>
                
                {/* Items */}
                <div className="space-y-2 mb-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {item.name} {item.quantity > 1 && `(×${item.quantity})`}
                      </span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial breakdown */}
                <div className="space-y-2 text-sm border-t border-white/20 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white">${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping:</span>
                    <span className="text-white">
                      {selectedOrder.shipping === 0 ? 'Free' : `$${selectedOrder.shipping?.toFixed(2) || '0.00'}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax (HST):</span>
                    <span className="text-white">${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {/* Total amount */}
                <div className="border-t border-white/30 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold text-lg">Total Paid:</span>
                    <div className="text-right">
                      {selectedOrder.payment_details.method === 'crypto' && selectedOrder.payment_details.crypto_amount ? (
                        <div>
                          <div className="text-white font-bold text-lg">
                            {selectedOrder.payment_details.crypto_amount.toFixed(6)} {selectedOrder.payment_details.crypto_currency}
                          </div>
                          <div className="text-slate-400 text-sm">
                            (${selectedOrder.total.toFixed(2)} {selectedOrder.payment_details.currency || 'CAD'})
                          </div>
                        </div>
                      ) : (
                        <div className="text-white font-bold text-lg">
                          ${selectedOrder.total.toFixed(2)} {selectedOrder.payment_details.currency || 'CAD'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="mt-6 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-green-400 font-medium">Payment Confirmed</span>
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