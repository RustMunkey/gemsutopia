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

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
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
      default:
        return <Overview />;
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}