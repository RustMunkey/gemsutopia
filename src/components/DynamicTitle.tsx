'use client';
import { useEffect, useState } from 'react';

interface DynamicTitleProps {
  fallback?: string;
  pageTitle?: string;
}

export default function DynamicTitle({ fallback = 'Gemsutopia', pageTitle }: DynamicTitleProps) {
  const [siteName, setSiteName] = useState(fallback);

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        console.log('[DYNAMIC TITLE] Fetching site name...');
        const response = await fetch('/api/site-info');
        if (response.ok) {
          const data = await response.json();
          console.log('[DYNAMIC TITLE] Site info response:', data);
          setSiteName(data.siteName || fallback);
        } else {
          console.error('[DYNAMIC TITLE] Failed to fetch site info:', response.status);
        }
      } catch (error) {
        console.error('[DYNAMIC TITLE] Error fetching site name:', error);
        // Keep fallback name
      }
    };

    fetchSiteName();
    
    // Listen for settings updates
    const handleSettingsUpdate = () => {
      console.log('[DYNAMIC TITLE] Settings updated event received, refetching...');
      setTimeout(fetchSiteName, 500); // Small delay to ensure backend is updated
    };
    
    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site-settings-updated') {
        console.log('[DYNAMIC TITLE] Storage update detected, refetching...');
        fetchSiteName();
      }
    };
    
    window.addEventListener('settings-updated', handleSettingsUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll periodically to catch any missed updates
    const pollInterval = setInterval(fetchSiteName, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [fallback]);

  useEffect(() => {
    const title = pageTitle ? `${pageTitle} - ${siteName}` : siteName;
    document.title = title;
  }, [siteName, pageTitle]);

  return null; // This component doesn't render anything
}