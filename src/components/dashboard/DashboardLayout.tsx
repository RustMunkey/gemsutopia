'use client';
import { ReactNode } from 'react';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  FileText,
  Star,
  Globe,
  ImageIcon,
  ShoppingBag,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { useMode } from '@/lib/contexts/ModeContext';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function DashboardLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mode, toggleMode } = useMode();

  const menuItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: LayoutDashboard,
      description: 'Dashboard Overview'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Sales & Insights'
    },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package,
      description: 'Manage Inventory'
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ShoppingBag,
      description: 'Customer Orders'
    },
    { 
      id: 'site-content', 
      label: 'Site Content', 
      icon: Globe
    },
    { 
      id: 'pages', 
      label: 'Pages', 
      icon: FileText,
      description: 'Static Page Content'
    },
    { 
      id: 'reviews', 
      label: 'Reviews', 
      icon: Star,
      description: 'Customer Feedback'
    },
    { 
      id: 'media', 
      label: 'Media', 
      icon: ImageIcon,
      description: 'Image Management'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-72 h-full transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        bg-black border-r border-white/20
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 border-b border-white/20 h-[65px]">
            <div className="flex items-center gap-3">
              <Image 
                src="/logos/gem.png" 
                alt="Gemsutopia" 
                width={32} 
                height={32}
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Gemsutopia
                </h1>
                <p className="text-xs text-slate-400">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-white/20 to-white/20 border border-white/30 text-white shadow-lg shadow-white/10' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        {/* Top Bar */}
        <header className="bg-black border-b border-white/20 sticky top-0 z-30 h-[65px]">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white capitalize">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-slate-400">
                  {menuItems.find(item => item.id === activeTab)?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <button
                onClick={toggleMode}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  mode === 'live' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                }`}
                title={`Switch to ${mode === 'live' ? 'Development' : 'Live'} mode`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  mode === 'live' 
                    ? 'bg-emerald-400 animate-pulse' 
                    : 'bg-orange-400 animate-pulse'
                }`}></div>
                <span className="text-sm font-medium">
                  {mode === 'live' ? 'Live' : 'Dev'}
                </span>
                <Settings className="h-3 w-3 opacity-60" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}