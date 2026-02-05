'use client';
import { ReactNode } from 'react';
import Image from 'next/image';
import {
  IconLayoutDashboard,
  IconPackage,
  IconLogout,
  IconMenu2,
  IconX,
  IconFileText,
  IconStar,
  IconWorld,
  IconPhoto,
  IconShoppingBag,
  IconSettings,
} from '@tabler/icons-react';
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
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mode, toggleMode } = useMode();

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: IconLayoutDashboard,
      description: 'Dashboard Overview',
    },
    {
      id: 'products',
      label: 'Products',
      icon: IconPackage,
      description: 'Manage Inventory',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: IconShoppingBag,
      description: 'Customer Orders',
    },
    {
      id: 'site-content',
      label: 'Site Content',
      icon: IconWorld,
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: IconFileText,
      description: 'Static Page Content',
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: IconStar,
      description: 'Customer Feedback',
    },
    {
      id: 'media',
      label: 'Media',
      icon: IconPhoto,
      description: 'Image Management',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: IconSettings,
      description: 'Site Configuration',
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/20 bg-black/80 backdrop-blur-md lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-[65px] items-center justify-between border-b border-white/20 px-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logos/gem.png"
                alt="Gemsutopia"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Gemsutopia</h1>
                <p className="text-xs text-slate-400">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white lg:hidden"
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? 'border border-white/30 bg-gradient-to-r from-white/20 to-white/20 text-white shadow-lg shadow-white/10'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  } `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/20 p-4">
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
            >
              <IconLogout size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-[65px] border-b border-white/20 bg-black/80 backdrop-blur-md">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white lg:hidden"
              >
                <IconMenu2 size={20} />
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
                className={`hidden items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 hover:scale-105 sm:flex ${
                  mode === 'live'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                }`}
                title={`Switch to ${mode === 'live' ? 'Development' : 'Live'} mode`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    mode === 'live' ? 'animate-pulse bg-emerald-400' : 'animate-pulse bg-orange-400'
                  }`}
                ></div>
                <span className="text-sm font-medium">{mode === 'live' ? 'Live' : 'Dev'}</span>
                <IconSettings size={12} className="opacity-60" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
