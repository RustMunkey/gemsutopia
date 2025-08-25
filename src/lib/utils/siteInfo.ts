import { getSetting, setSetting, getAllSettings, initializeDefaultSettings } from '@/lib/database/siteSettings';

// Initialize defaults on module load
initializeDefaultSettings().catch(error => {
  console.error('Failed to initialize default settings:', error);
});

export interface SiteInfo {
  siteName: string;
  siteTagline: string;
  siteFavicon: string;
}

// Get all site info from database
export async function getSiteInfo(): Promise<SiteInfo> {
  try {
    const settings = await getAllSettings();
    
    return {
      siteName: settings.site_name || 'Gemsutopia',
      siteTagline: settings.site_tagline || 'Discover the beauty of natural gemstones',
      siteFavicon: settings.site_favicon || '/favicon.ico',
    };
  } catch (error) {
    console.error('Error fetching site info from database:', error);
    // Return defaults on error
    return {
      siteName: 'Gemsutopia',
      siteTagline: 'Discover the beauty of natural gemstones',
      siteFavicon: '/favicon.ico',
    };
  }
}

// Update site info in database
export async function updateSiteInfo(updates: Partial<SiteInfo>): Promise<boolean> {
  try {
    const dbUpdates: Record<string, string> = {};
    
    if (updates.siteName !== undefined) {
      dbUpdates.site_name = updates.siteName;
    }
    if (updates.siteTagline !== undefined) {
      dbUpdates.site_tagline = updates.siteTagline;
    }
    if (updates.siteFavicon !== undefined) {
      dbUpdates.site_favicon = updates.siteFavicon;
    }

    if (Object.keys(dbUpdates).length > 0) {
      const success = await Promise.all(
        Object.entries(dbUpdates).map(([key, value]) => setSetting(key, value))
      );
      
      return success.every(result => result);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating site info in database:', error);
    return false;
  }
}

// Get specific site setting
export async function getSiteSetting(key: keyof SiteInfo): Promise<string | null> {
  const dbKey = key === 'siteName' ? 'site_name' : 
                key === 'siteTagline' ? 'site_tagline' :
                key === 'siteFavicon' ? 'site_favicon' : null;
                
  if (!dbKey) return null;
  
  return await getSetting(dbKey);
}