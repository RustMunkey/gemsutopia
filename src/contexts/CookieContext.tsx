'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface CookieContextType {
  preferences: CookiePreferences;
  hasConsented: boolean;
  updatePreferences: (newPreferences: Partial<CookiePreferences>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  showBanner: boolean;
  dismissBanner: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
};

export function CookieProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Check if user has already made a choice
    const savedPreferences = localStorage.getItem('cookiePreferences');
    const hasConsentedBefore = localStorage.getItem('cookieConsent');

    if (savedPreferences && hasConsentedBefore) {
      setPreferences(JSON.parse(savedPreferences));
      setHasConsented(true);
      setShowBanner(false);
      loadGoogleAnalytics(JSON.parse(savedPreferences).analytics);
    } else {
      // Show banner if no previous consent
      setShowBanner(true);
    }
  }, [isClient]);

  const loadGoogleAnalytics = (analyticsEnabled: boolean) => {
    if (analyticsEnabled && typeof window !== 'undefined') {
      // Load Google Analytics if analytics cookies are enabled
      // Replace 'GA_MEASUREMENT_ID' with actual Google Analytics ID
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }
      (window as typeof window & { gtag: typeof gtag }).gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        anonymize_ip: true,
        cookie_flags: 'secure;samesite=none'
      });
    }
  };

  const updatePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    localStorage.setItem('cookiePreferences', JSON.stringify(updatedPreferences));
    localStorage.setItem('cookieConsent', 'true');
    setHasConsented(true);
    
    // Load/unload analytics based on preferences
    loadGoogleAnalytics(updatedPreferences.analytics);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    updatePreferences(allAccepted);
    setShowBanner(false);
  };

  const rejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    updatePreferences(onlyEssential);
    setShowBanner(false);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('cookieConsent', 'true');
    setHasConsented(true);
  };

  return (
    <CookieContext.Provider
      value={{
        preferences,
        hasConsented,
        updatePreferences,
        acceptAll,
        rejectAll,
        showBanner,
        dismissBanner,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export const useCookies = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
};

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}