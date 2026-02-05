'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/admin-dashboard/DashboardLayout';
import Overview from '@/components/admin-dashboard/Overview';
import Products from '@/components/admin-dashboard/Products';
import OrdersManager from '@/components/admin-dashboard/OrdersManager';
import SiteContent from '@/components/admin-dashboard/SiteContent';
import Pages from '@/components/admin-dashboard/Pages';
import Reviews from '@/components/admin-dashboard/Reviews';
import Settings from '@/components/admin-dashboard/Settings';
import MediaManager from '@/components/admin-dashboard/MediaManager';
import { ModeProvider } from '@/lib/contexts/ModeContext';
import { Spinner } from '@/components/ui/spinner';

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
      headers: { Authorization: `Bearer ${token}` },
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
    } catch {
      // Logout API error - continue with local logout
    }

    localStorage.removeItem('admin-token');
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="48" />
          <p className="font-medium text-white">Loading Dashboard...</p>
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

  const handleNavigateToOrders = () => {
    setActiveTab('orders');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            onNavigateToProducts={handleNavigateToProducts}
            onNavigateToOrders={handleNavigateToOrders}
          />
        );
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
      case 'media':
        return <MediaManager />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Overview
            onNavigateToProducts={handleNavigateToProducts}
            onNavigateToOrders={handleNavigateToOrders}
          />
        );
    }
  };

  return (
    <ModeProvider>
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
        {renderContent()}
      </DashboardLayout>
    </ModeProvider>
  );
}
