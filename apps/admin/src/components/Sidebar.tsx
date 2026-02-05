'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconPackage,
  IconShoppingCart,
  IconGavel,
  IconUsers,
  IconBrush,
  IconFileText,
  IconStar,
  IconAppWindow,
  IconChartBar,
  IconSettings,
  IconPhoto,
  IconShare,
  IconMail,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
  { name: 'Products', href: '/products', icon: IconPackage },
  { name: 'Orders', href: '/orders', icon: IconShoppingCart },
  { name: 'Auctions', href: '/auctions', icon: IconGavel },
  { name: 'Customers', href: '/customers', icon: IconUsers },
  { name: 'Front Page', href: '/content', icon: IconBrush },
  { name: 'Pages', href: '/pages', icon: IconFileText },
  { name: 'Messages', href: '/messages', icon: IconMail },
  { name: 'Reviews', href: '/reviews', icon: IconStar },
  { name: 'Socials', href: '/socials', icon: IconShare },
  { name: 'SEO', href: '/marketing', icon: IconAppWindow },
  { name: 'Reports', href: '/reports', icon: IconChartBar },
  { name: 'Media', href: '/media', icon: IconPhoto },
  { name: 'Settings', href: '/settings', icon: IconSettings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b border-border px-4">
        <Link href="/dashboard" onClick={onNavigate}>
          <Image src="/logos/logo2.svg" alt="Gemsutopia" width={160} height={22} className="w-full max-w-[160px] object-contain dark:invert" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navigation.map(item => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          href="https://gemsutopia.ca"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>View Store</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
