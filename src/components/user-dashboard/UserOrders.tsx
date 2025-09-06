'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faEye, faDownload, faFilter } from '@fortawesome/free-solid-svg-icons';

interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: string;
  items: {
    name: string;
    quantity: number;
    price: string;
    image: string;
  }[];
  trackingNumber?: string;
}

export default function UserOrders() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Mock data - replace with actual API call
  const orders: Order[] = [
    {
      id: '12345',
      date: '2025-01-15',
      status: 'Delivered',
      total: '$156.99',
      trackingNumber: 'TRK123456789',
      items: [
        {
          name: 'Amethyst Crystal Set',
          quantity: 1,
          price: '$89.99',
          image: '/images/products/amethyst.jpg'
        },
        {
          name: 'Rose Quartz Pendant',
          quantity: 2,
          price: '$33.50',
          image: '/images/products/rose-quartz.jpg'
        }
      ]
    },
    {
      id: '12344',
      date: '2025-01-10',
      status: 'Shipped',
      total: '$89.50',
      trackingNumber: 'TRK987654321',
      items: [
        {
          name: 'Citrine Bracelet',
          quantity: 1,
          price: '$89.50',
          image: '/images/products/citrine.jpg'
        }
      ]
    },
    {
      id: '12343',
      date: '2025-01-05',
      status: 'Processing',
      total: '$245.00',
      items: [
        {
          name: 'Gemstone Collection Bundle',
          quantity: 1,
          price: '$199.00',
          image: '/images/products/bundle.jpg'
        },
        {
          name: 'Crystal Healing Guide',
          quantity: 1,
          price: '$46.00',
          image: '/images/products/guide.jpg'
        }
      ]
    }
  ];

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        
        {/* Filter */}
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Orders</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FontAwesomeIcon icon={faShoppingBag} className="text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? "You haven't placed any orders yet." 
                : `No ${filterStatus} orders found.`
              }
            </p>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Start Shopping
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{order.total}</p>
                    <p className="text-sm text-gray-600">{order.date}</p>
                  </div>
                </div>
                {order.trackingNumber && (
                  <p className="text-sm text-gray-600 mt-2">
                    Tracking: <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faShoppingBag} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-6 pt-6 border-t border-gray-200">
                  <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  
                  {order.status === 'Delivered' && (
                    <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                      <span>Download Invoice</span>
                    </button>
                  )}
                  
                  {order.trackingNumber && (
                    <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      <span>Track Package</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}