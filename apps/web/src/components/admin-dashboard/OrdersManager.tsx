'use client';
import { useState, useEffect } from 'react';
import {
  IconPackage,
  IconCurrencyDollar,
  IconUser,
  IconCalendar,
  IconEye,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import { isTestOrder, PaymentDetails } from '@/lib/utils/orderUtils';
import { useMode } from '@/lib/contexts/ModeContext';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface OrderItem {
  image?: string;
  name: string;
  quantity: number;
  price: number;
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
  items: OrderItem[];
  paymentDetails?: PaymentDetails;
  shippingAddress?: ShippingAddress;
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
      const response = await fetch(`/api/orders?mode=${mode}`);
      const data = await response.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      // Error fetching orders
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
      minute: '2-digit',
    });
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

  const formatPaymentAmount = (order: Order) => {
    const paymentDetails = order.paymentDetails as
      | {
          method: string;
          payment_id: string;
          amount: number;
          currency?: string;
          crypto_type?: string;
          crypto_amount?: number;
          crypto_currency?: string;
          wallet_address?: string;
          network?: string;
        }
      | undefined;

    const total = parseFloat(order.total || '0');

    if (
      paymentDetails?.method === 'crypto' &&
      paymentDetails.crypto_amount &&
      paymentDetails.crypto_currency
    ) {
      return (
        <div>
          <div className="font-semibold text-white">
            {paymentDetails.crypto_amount.toFixed(6)} {paymentDetails.crypto_currency}
          </div>
          <div className="text-xs text-slate-400">
            ${total.toFixed(2)} {paymentDetails.currency || 'CAD'}
          </div>
        </div>
      );
    }

    return (
      <div className="font-semibold text-white">
        ${total.toFixed(2)} {paymentDetails?.currency || 'CAD'}
      </div>
    );
  };

  const deleteTestOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this test order? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      if (response.ok) {
        fetchOrders(); // Refresh the orders list
        toast.success('Test order deleted');
      } else {
        toast.error('Failed to delete test order');
      }
    } catch {
      toast.error('Failed to delete test order');
    }
  };

  const exportOrders = () => {
    const csvContent = [
      [
        'Date',
        'Order ID',
        'Customer',
        'Email',
        'Total',
        'Status',
        'Payment Method',
        'Payment ID',
      ].join(','),
      ...orders.map(order => {
        const paymentDetails = order.paymentDetails as
          | { method?: string; payment_id?: string }
          | undefined;
        return [
          new Date(order.createdAt || '').toISOString().split('T')[0],
          order.id,
          `"${order.customerName || ''}"`,
          order.customerEmail,
          parseFloat(order.total || '0').toFixed(2),
          order.status,
          paymentDetails?.method || '',
          paymentDetails?.payment_id || '',
        ].join(',');
      }),
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
      <div className="flex h-64 items-center justify-center">
        <Spinner size="48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white">Orders ✨</h1>
            <p className="text-slate-400">Manage customer orders and payments</p>
          </div>
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
          >
            <IconDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}
            >
              <IconPackage
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'live' ? 'text-blue-400' : 'text-orange-400'}`}
            >
              <IconEye size={16} />
              <span className="ml-1">{mode === 'live' ? 'Live' : 'Dev'}</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-sm text-slate-400">Total Orders</p>
          </div>
        </div>

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
              className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`}
            >
              <IconCurrencyDollar size={16} />
              <span className="ml-1">Revenue</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">
              $
              {orders
                .reduce((sum: number, order: Order) => sum + parseFloat(order.total || '0'), 0)
                .toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">Total Revenue</p>
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-purple-500/20'}`}
            >
              <IconUser
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}`}
            >
              <IconUser size={16} />
              <span className="ml-1">Unique</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">
              {new Set(orders.map(order => order.customerEmail)).size}
            </p>
            <p className="text-sm text-slate-400">Unique Customers</p>
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}
            >
              <IconCalendar
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}
              />
            </div>
            <div
              className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`}
            >
              <IconCalendar size={16} />
              <span className="ml-1">Month</span>
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">
              {
                orders.filter(
                  order => new Date(order.createdAt || '').getMonth() === new Date().getMonth()
                ).length
              }
            </p>
            <p className="text-sm text-slate-400">This Month</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-black">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/20 bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-white">Order ID</th>
                <th className="px-6 py-4 text-left font-medium text-white">Customer</th>
                <th className="px-6 py-4 text-left font-medium text-white">Total</th>
                <th className="px-6 py-4 text-left font-medium text-white">Status</th>
                <th className="px-6 py-4 text-left font-medium text-white">Date</th>
                <th className="px-6 py-4 text-left font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-6 py-4 font-mono text-sm text-slate-300">
                    #{order.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{order.customerName}</p>
                      <p className="text-sm text-slate-400">{order.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{formatPaymentAmount(order)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded border px-2 py-1 text-xs font-medium ${getStatusColor(order.status || 'pending', isTestOrder(order))}`}
                    >
                      {isTestOrder(order) ? 'TEST' : (order.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{formatDate(order.createdAt || '')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-2 rounded bg-white/10 px-3 py-1 text-sm text-white transition-colors hover:bg-white/20"
                      >
                        <IconEye size={12} />
                        View
                      </button>
                      {isTestOrder(order) && (
                        <button
                          onClick={() => deleteTestOrder(order.id)}
                          className="p-1 text-red-400 transition-colors hover:text-red-300"
                          title="Delete test order"
                        >
                          <IconTrash size={16} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/20 bg-black p-8">
            {/* Receipt Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-start justify-between">
                <div></div>
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-white">Order Receipt</h2>
                  <p className="text-slate-400">Gemsutopia Admin Dashboard</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xl text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Column - Order Details */}
              <div className="rounded-lg bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Order Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Number:</span>
                    <span className="font-mono text-sm text-white">
                      {selectedOrder.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-white">{formatDate(selectedOrder.createdAt || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`rounded border px-2 py-1 text-xs font-medium ${getStatusColor(selectedOrder.status || 'pending', isTestOrder(selectedOrder))}`}
                    >
                      {isTestOrder(selectedOrder)
                        ? 'TEST'
                        : (selectedOrder.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mt-4 border-t border-white/20 pt-3">
                    <h4 className="mb-2 font-medium text-white">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">
                        <strong>Name:</strong> {selectedOrder.customerName}
                      </p>
                      <p className="text-white">
                        <strong>Email:</strong> {selectedOrder.customerEmail}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {selectedOrder.shippingAddress &&
                    (() => {
                      const addr = selectedOrder.shippingAddress as {
                        firstName: string;
                        lastName: string;
                        address: string;
                        apartment?: string;
                        city: string;
                        state: string;
                        zipCode: string;
                        country: string;
                        phone?: string;
                      };
                      return (
                        <div className="mt-4 border-t border-white/20 pt-3">
                          <h4 className="mb-2 font-medium text-white">Shipping Address</h4>
                          <div className="space-y-1 text-sm text-slate-300">
                            <p className="font-medium text-white">
                              {addr.firstName} {addr.lastName}
                            </p>
                            <p>{addr.address}</p>
                            {addr.apartment && <p>Apt/Suite: {addr.apartment}</p>}
                            <p>
                              {addr.city}, {addr.state} {addr.zipCode}
                            </p>
                            <p>{addr.country}</p>
                            {addr.phone && <p>Phone: {addr.phone}</p>}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Payment Info */}
                  {(() => {
                    const pd = selectedOrder.paymentDetails as
                      | {
                          method: string;
                          payment_id: string;
                          amount: number;
                          currency?: string;
                          crypto_type?: string;
                          crypto_amount?: number;
                          crypto_currency?: string;
                          wallet_address?: string;
                          network?: string;
                        }
                      | undefined;
                    return (
                      <div className="mt-4 border-t border-white/20 pt-3">
                        <h4 className="mb-2 font-medium text-white">Payment Information</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-white">
                            <strong>Method:</strong> {pd?.method}
                          </p>
                          <p className="text-white">
                            <strong>Payment ID:</strong>
                            <span className="ml-2 font-mono text-xs break-all">
                              {pd?.payment_id}
                            </span>
                          </p>

                          {pd?.method === 'crypto' && (
                            <>
                              <p className="text-white">
                                <strong>Crypto Type:</strong> {pd.crypto_currency}
                              </p>
                              <p className="text-white">
                                <strong>Network:</strong> {pd.network}
                              </p>
                              {pd.wallet_address && (
                                <p className="text-white">
                                  <strong>Wallet:</strong>
                                  <span className="ml-2 font-mono text-xs">
                                    {pd.wallet_address.slice(0, 8)}...{pd.wallet_address.slice(-6)}
                                  </span>
                                </p>
                              )}
                              {pd.crypto_currency === 'SOL' && (
                                <p className="text-white">
                                  <strong>Explorer:</strong>
                                  <a
                                    href={`https://explorer.solana.com/tx/${pd.payment_id}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-blue-400 underline hover:text-blue-300"
                                  >
                                    View Transaction
                                  </a>
                                </p>
                              )}
                              {pd.crypto_currency === 'ETH' && (
                                <p className="text-white">
                                  <strong>Explorer:</strong>
                                  <a
                                    href={`https://sepolia.etherscan.io/tx/${pd.payment_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-blue-400 underline hover:text-blue-300"
                                  >
                                    View Transaction
                                  </a>
                                </p>
                              )}
                              {pd.crypto_currency === 'BTC' && (
                                <p className="text-white">
                                  <strong>Explorer:</strong>
                                  <a
                                    href={`https://blockstream.info/testnet/tx/${pd.payment_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-blue-400 underline hover:text-blue-300"
                                  >
                                    View Transaction
                                  </a>
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column - Order Breakdown */}
              <div className="rounded-lg bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Order Breakdown</h3>

                {/* Items with Images */}
                <div className="mb-4 space-y-3">
                  <h4 className="mb-2 text-sm font-medium text-white">Products Ordered:</h4>
                  {(
                    selectedOrder.items as Array<{
                      image?: string;
                      name: string;
                      quantity: number;
                      price: number;
                    }>
                  )?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded border border-white/20 bg-white/10 p-2"
                    >
                      {item.image && (
                        <div className="h-12 w-12 flex-shrink-0 rounded bg-white/10">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full rounded object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="truncate text-sm font-medium text-white">{item.name}</p>
                            <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(() => {
                  const pd = selectedOrder.paymentDetails as
                    | {
                        method: string;
                        currency?: string;
                        crypto_amount?: number;
                        crypto_currency?: string;
                      }
                    | undefined;
                  const total = parseFloat(selectedOrder.total || '0');
                  const subtotal = parseFloat(selectedOrder.subtotal || '0');
                  const shipping = parseFloat(selectedOrder.shipping || '0');
                  const tax = parseFloat(selectedOrder.tax || '0');
                  const currency = pd?.currency || 'CAD';

                  return (
                    <>
                      {/* Financial breakdown */}
                      <div className="space-y-2 border-t border-white/20 pt-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Subtotal:</span>
                          <span className="text-white">
                            ${subtotal.toFixed(2)} {currency}
                          </span>
                        </div>

                        {/* Shipping */}
                        <div className="flex justify-between">
                          <span className="text-slate-400">Shipping:</span>
                          <span className="text-white">
                            {shipping === 0 ? (
                              <span className="text-green-400">FREE</span>
                            ) : (
                              `$${shipping.toFixed(2)} ${currency}`
                            )}
                          </span>
                        </div>

                        {/* Tax */}
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            Tax {pd?.method === 'crypto' ? '(Tax Free)' : '(HST/Sales Tax)'}:
                          </span>
                          <span className="text-white">
                            {pd?.method === 'crypto' ? (
                              <span className="text-green-400">Tax Free (Crypto)</span>
                            ) : (
                              `$${tax.toFixed(2)} ${currency}`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Total amount */}
                      <div className="mt-4 border-t border-white/30 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">Total Paid:</span>
                          <div className="text-right">
                            {pd?.method === 'crypto' && pd.crypto_amount ? (
                              <div>
                                <div className="text-lg font-bold text-white">
                                  {pd.crypto_amount.toFixed(6)} {pd.crypto_currency}
                                </div>
                                <div className="text-sm text-slate-400">
                                  (${total.toFixed(2)} {currency})
                                </div>
                              </div>
                            ) : (
                              <div className="text-lg font-bold text-white">
                                ${total.toFixed(2)} {currency}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Payment Status */}
                <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/20 p-3">
                  <div className="flex items-center">
                    <div className="mr-3 h-2 w-2 rounded-full bg-green-400"></div>
                    <span className="font-medium text-green-400">Payment Confirmed</span>
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
