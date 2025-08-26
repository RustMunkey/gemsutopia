'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Overview from '@/components/dashboard/Overview';
import Products from '@/components/dashboard/Products';
import OrdersManager from '@/components/dashboard/OrdersManager';
import SiteContent from '@/components/dashboard/SiteContent';
import Pages from '@/components/dashboard/Pages';
import Reviews from '@/components/dashboard/Reviews';
import Analytics from '@/components/dashboard/Analytics';
import Settings from '@/components/dashboard/Settings';
import MediaManager from '@/components/dashboard/MediaManager';
import { ModeProvider } from '@/lib/contexts/ModeContext';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('admin-token');
    if (!token) {
      router.push('/admin');
      return;
    }

    // Verify token is valid
    fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin-token');
        router.push('/admin');
      }
    })
    .catch(() => {
      localStorage.removeItem('admin-token');
      router.push('/admin');
    })
    .finally(() => {
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    localStorage.removeItem('admin-token');
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleNavigateToProducts = () => {
    setActiveTab('products');
    // Small delay to ensure Products component is mounted before triggering modal
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAddProductModal'));
    }, 100);
  };

  const handleNavigateToAnalytics = () => {
    setActiveTab('analytics');
  };

  const handleNavigateToOrders = () => {
    setActiveTab('orders');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview 
          onNavigateToProducts={handleNavigateToProducts}
          onNavigateToAnalytics={handleNavigateToAnalytics}
          onNavigateToOrders={handleNavigateToOrders}
        />;
      case 'products':
        return <Products />;
      case 'orders':
        return <OrdersManager />;
      case 'site-content':
        return <SiteContent />;
      case 'pages':
        return <Pages />;
      case 'reviews':
        return <Reviews />;
      case 'analytics':
        return <Analytics />;
      case 'media':
        return <MediaManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview 
          onNavigateToProducts={handleNavigateToProducts}
          onNavigateToAnalytics={handleNavigateToAnalytics}
          onNavigateToOrders={handleNavigateToOrders}
        />;
    }
  };

  return (
    <ModeProvider>
      <DashboardLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      >
        {renderContent()}
      </DashboardLayout>
    </ModeProvider>
  );
}