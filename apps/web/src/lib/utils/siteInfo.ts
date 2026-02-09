import { getSetting, getAllSettings } from '@/lib/database/siteSettings';

export interface SiteInfo {
  siteName: string;
  siteTagline: string;
  siteFavicon: string;
}

// Get all site info from database (read-only)
export async function getSiteInfo(): Promise<SiteInfo> {
  try {
    const settings = await getAllSettings();

    return {
      siteName: settings.site_name || 'Gemsutopia',
      siteTagline: settings.site_tagline || 'Discover the beauty of natural gemstones',
      siteFavicon: settings.site_favicon || '/favicon.ico',
    };
  } catch {
    // Return defaults on error
    return {
      siteName: 'Gemsutopia',
      siteTagline: 'Discover the beauty of natural gemstones',
      siteFavicon: '/favicon.ico',
    };
  }
}

// Get specific site setting (read-only)
export async function getSiteSetting(key: keyof SiteInfo): Promise<string | null> {
  const dbKey =
    key === 'siteName'
      ? 'site_name'
      : key === 'siteTagline'
        ? 'site_tagline'
        : key === 'siteFavicon'
          ? 'site_favicon'
          : null;

  if (!dbKey) return null;

  return await getSetting(dbKey);
}

// Site info updates moved to Quickdash BaaS
