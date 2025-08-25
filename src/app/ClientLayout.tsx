'use client';
import { GemPouchProvider } from '../contexts/GemPouchContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CookieProvider } from '../contexts/CookieContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { WalletProvider } from '../contexts/WalletContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { ModeProvider } from '../lib/contexts/ModeContext';
import CookieBanner from '../components/CookieBanner';
import PageViewTracker from '../components/PageViewTracker';
import MaintenanceOverlay from '../components/MaintenanceOverlay';
import DynamicMetadata from '../components/DynamicMetadata';
import DynamicTitle from '../components/DynamicTitle';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider>
      <CookieProvider>
        <AuthProvider>
          <CurrencyProvider>
            <InventoryProvider>
              <WishlistProvider>
                <GemPouchProvider>
                  <WalletProvider>
                    <NotificationProvider>
                      <PageViewTracker />
                      <DynamicMetadata />
                      <DynamicTitle />
                      {children}
                      <CookieBanner />
                      <MaintenanceOverlay />
                    </NotificationProvider>
                  </WalletProvider>
                </GemPouchProvider>
              </WishlistProvider>
            </InventoryProvider>
          </CurrencyProvider>
        </AuthProvider>
      </CookieProvider>
    </ModeProvider>
  );
}