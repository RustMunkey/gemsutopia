'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/track-page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (error) {
        // Silent fail - don't interfere with user experience
        console.debug('Page view tracking failed:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  return null; // This component renders nothing
}