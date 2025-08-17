'use client';
import { GemPouchProvider } from '../contexts/GemPouchContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CookieProvider } from '../contexts/CookieContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import CookieBanner from '../components/CookieBanner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CookieProvider>
      <CurrencyProvider>
        <WishlistProvider>
          <GemPouchProvider>
            {children}
            <CookieBanner />
          </GemPouchProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </CookieProvider>
  );
}