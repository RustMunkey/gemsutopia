'use client';
import { GemPouchProvider } from '../contexts/GemPouchContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CookieProvider } from '../contexts/CookieContext';
import CookieBanner from '../components/CookieBanner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CookieProvider>
      <WishlistProvider>
        <GemPouchProvider>
          {children}
          <CookieBanner />
        </GemPouchProvider>
      </WishlistProvider>
    </CookieProvider>
  );
}