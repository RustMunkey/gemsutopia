'use client';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faHeart, faUser, faStar } from '@fortawesome/free-solid-svg-icons';

export default function DashboardOverview() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Orders',
      value: '12',
      icon: faShoppingBag,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      title: 'Wishlist Items',
      value: '8',
      icon: faHeart,
      color: 'bg-pink-500',
      change: '+3 this week'
    },
    {
      title: 'Reviews Written',
      value: '5',
      icon: faStar,
      color: 'bg-yellow-500',
      change: '+1 this month'
    }
  ];

  const recentOrders = [
    {
      id: '12345',
      date: '2025-01-15',
      status: 'Delivered',
      total: '$156.99',
      items: 'Amethyst Crystal Set + 2 more'
    },
    {
      id: '12344',
      date: '2025-01-10',
      status: 'Shipped',
      total: '$89.50',
      items: 'Rose Quartz Pendant'
    },
    {
      id: '12343',
      date: '2025-01-05',
      status: 'Processing',
      total: '$245.00',
      items: 'Gemstone Collection Bundle + 1 more'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0]}!</h1>
        <p className="opacity-90">Here&apos;s what&apos;s happening with your account</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-green-600 text-sm mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <FontAwesomeIcon icon={stat.icon} className="text-white text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id}</p>
                  <p className="text-gray-600 text-sm">{order.items}</p>
                  <p className="text-gray-500 text-sm">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{order.total}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button className="text-purple-600 hover:text-purple-800 font-medium">
              View All Orders →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <FontAwesomeIcon icon={faShoppingBag} className="text-purple-600 mr-3" />
              Browse New Arrivals
            </button>
            <button className="w-full text-left p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
              <FontAwesomeIcon icon={faHeart} className="text-pink-600 mr-3" />
              View Wishlist
            </button>
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <FontAwesomeIcon icon={faUser} className="text-blue-600 mr-3" />
              Update Profile
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email Verified</span>
              <span className="text-green-600 font-medium">✓ Verified</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="text-gray-900 font-medium">Jan 2025</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Account Type</span>
              <span className="text-gray-900 font-medium">Standard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}