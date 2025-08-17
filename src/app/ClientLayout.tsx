'use client';
import { GemPouchProvider } from '../contexts/GemPouchContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CookieProvider } from '../contexts/CookieContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { AuthProvider } from '../contexts/AuthContext';
import CookieBanner from '../components/CookieBanner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CookieProvider>
      <AuthProvider>
        <CurrencyProvider>
          <WishlistProvider>
            <GemPouchProvider>
              {children}
              <CookieBanner />
            </GemPouchProvider>
          </WishlistProvider>
        </CurrencyProvider>
      </AuthProvider>
    </CookieProvider>
  );
}