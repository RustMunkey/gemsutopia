'use client';
import React, { createContext, useContext, useEffect, ReactNode, Suspense } from 'react';
import { analytics } from '@/lib/analytics/tracker';
import { usePathname, useSearchParams } from 'next/navigation';

interface AnalyticsContextType {
  trackEvent: (eventType: string, eventData?: any) => Promise<void>;
  trackPageView: (page?: string) => Promise<void>;
  trackCartAdd: (productId: string, productName: string, price: number, quantity?: number) => Promise<void>;
  trackCartRemove: (productId: string, productName: string) => Promise<void>;
  trackCheckoutStart: (cartValue: number, itemCount: number) => Promise<void>;
  trackCheckoutComplete: (orderId: string, orderValue: number) => Promise<void>;
  trackProductView: (productId: string, productName: string, price: number) => Promise<void>;
  trackSearch: (searchTerm: string, resultCount: number) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  enableAutoTracking?: boolean;
}

// Separate component for search params tracking
function AnalyticsTracker({ enableAutoTracking }: { enableAutoTracking: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-track page views when route changes
  useEffect(() => {
    if (enableAutoTracking && analytics && typeof window !== 'undefined') {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      analytics.trackPageView(url);
    }
  }, [pathname, searchParams, enableAutoTracking]);

  return null;
}

export function AnalyticsProvider({ children, enableAutoTracking = true }: AnalyticsProviderProps) {

  const contextValue: AnalyticsContextType = {
    trackEvent: async (eventType: string, eventData?: any) => {
      if (analytics) {
        await analytics.trackEvent(eventType, eventData);
      }
    },
    trackPageView: async (page?: string) => {
      if (analytics) {
        await analytics.trackPageView(page);
      }
    },
    trackCartAdd: async (productId: string, productName: string, price: number, quantity = 1) => {
      if (analytics) {
        await analytics.trackCartAdd(productId, productName, price, quantity);
      }
    },
    trackCartRemove: async (productId: string, productName: string) => {
      if (analytics) {
        await analytics.trackCartRemove(productId, productName);
      }
    },
    trackCheckoutStart: async (cartValue: number, itemCount: number) => {
      if (analytics) {
        await analytics.trackCheckoutStart(cartValue, itemCount);
      }
    },
    trackCheckoutComplete: async (orderId: string, orderValue: number) => {
      if (analytics) {
        await analytics.trackCheckoutComplete(orderId, orderValue);
      }
    },
    trackProductView: async (productId: string, productName: string, price: number) => {
      if (analytics) {
        await analytics.trackProductView(productId, productName, price);
      }
    },
    trackSearch: async (searchTerm: string, resultCount: number) => {
      if (analytics) {
        await analytics.trackSearch(searchTerm, resultCount);
      }
    }
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {/* Wrap analytics tracker in Suspense to avoid SSR issues with useSearchParams */}
      <Suspense fallback={null}>
        <AnalyticsTracker enableAutoTracking={enableAutoTracking} />
      </Suspense>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return no-op functions if analytics context is not available
    return {
      trackEvent: async () => {},
      trackPageView: async () => {},
      trackCartAdd: async () => {},
      trackCartRemove: async () => {},
      trackCheckoutStart: async () => {},
      trackCheckoutComplete: async () => {},
      trackProductView: async () => {},
      trackSearch: async () => {},
    };
  }
  return context;
}

export default AnalyticsProvider;