'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingBag, 
  faCog, 
  faHeart,
  faSignOutAlt,
  faBars,
  faTimes,
  faDashboard
} from '@fortawesome/free-solid-svg-icons';
import DashboardOverview from './DashboardOverview';
import UserProfile from './UserProfile';
import UserOrders from './UserOrders';
import UserWishlist from './UserWishlist';
import UserSettings from './UserSettings';

type DashboardSection = 'overview' | 'profile' | 'orders' | 'wishlist' | 'settings';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { id: 'overview' as DashboardSection, label: 'Overview', icon: faDashboard },
    { id: 'profile' as DashboardSection, label: 'Profile', icon: faUser },
    { id: 'orders' as DashboardSection, label: 'Orders', icon: faShoppingBag },
    { id: 'wishlist' as DashboardSection, label: 'Wishlist', icon: faHeart },
    { id: 'settings' as DashboardSection, label: 'Settings', icon: faCog },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'profile':
        return <UserProfile />;
      case 'orders':
        return <UserOrders />;
      case 'wishlist':
        return <UserWishlist />;
      case 'settings':
        return <UserSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden bg-white shadow-sm p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} className="w-6 h-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-30 w-64 h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-white text-lg" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Welcome back!</h2>
                <p className="text-sm text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}