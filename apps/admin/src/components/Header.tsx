'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AdminSession } from '@gemsutopia/auth/admin';
import {
  IconBell,
  IconLogout,
  IconMenu2,
  IconSun,
  IconMoon,
  IconPlus,
  IconExternalLink,
  IconShoppingCart,
  IconMail,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'stock';
  title: string;
  description: string;
  time: string;
  link: string;
}

interface HeaderProps {
  session: AdminSession;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Header({ session, onMenuToggle, showMenuButton }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <IconShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'message': return <IconMail className="h-4 w-4 text-green-500" />;
      case 'stock': return <IconAlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <IconBell className="h-4 w-4" />;
    }
  };

  const formatTime = (time: string) => {
    const diff = Date.now() - new Date(time).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {showMenuButton && (
          <Button variant="ghost" size="icon" onClick={onMenuToggle} className="md:hidden">
            <IconMenu2 className="h-5 w-5" />
          </Button>
        )}

        {/* Search */}
        <div className="hidden sm:block w-full max-w-xs lg:max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-1.5 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Quick add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconPlus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/products?action=new')}>
              New Product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/auctions?action=new')}>
              New Auction
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/orders')}>
              View Orders
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View store */}
        <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" asChild>
          <Link href="https://gemsutopia.ca" target="_blank">
            <IconExternalLink className="h-4 w-4" />
          </Link>
        </Button>

        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
          {theme === 'dark' ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <IconBell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                    onClick={() => router.push(notif.link)}
                  >
                    <div className="shrink-0 mt-0.5">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(notif.time)}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 ml-1">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {session.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium hidden md:inline">{session.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session.name}</p>
              <p className="text-xs text-muted-foreground">{session.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <IconLogout className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
