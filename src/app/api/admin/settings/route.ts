import { NextRequest, NextResponse } from 'next/server';
import { updateSEOMetadata } from '@/lib/utils/seoMetadata';
import { updateSiteInfo } from '@/lib/utils/siteInfo';
import { getAllSettings, setMultipleSettings } from '@/lib/database/siteSettings';

// Load settings from database
async function loadSettingsFromDB() {
  try {
    const dbSettings = await getAllSettings();
    
    // Merge with defaults
    return {
      // General Settings (from database)
      siteName: dbSettings.site_name || 'Gemsutopia',
      siteFavicon: dbSettings.site_favicon || '/favicon.ico',
      
      // Shipping Settings (these can stay in-memory for now or be moved to DB later)
      enableShipping: true,
      shippingRates: [],
      internationalShipping: true,
      
      // Tax Settings  
      enableTaxes: true,
      taxRate: 13.0,
      taxExemptStates: [],
      
      // Payment Settings
      stripeEnabled: true,
      paypalEnabled: true,
      cryptoEnabled: true,
      
      // Currency Settings
      baseCurrency: 'CAD',
      supportedCurrencies: ['CAD', 'USD', 'EUR'],
      
      // SEO Settings (from database)
      seoTitle: dbSettings.seo_title || 'Gemsutopia - Premium Gemstone Collection',
      seoDescription: dbSettings.seo_description || 'Hi, I\'m Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...',
      seoKeywords: dbSettings.seo_keywords || 'gemstones, jewelry, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing',
      seoAuthor: dbSettings.seo_author || 'Gemsutopia',
      openGraphTitle: dbSettings.open_graph_title || '',
      openGraphDescription: dbSettings.open_graph_description || '',
      openGraphImage: dbSettings.open_graph_image || '',
      twitterTitle: dbSettings.twitter_title || '',
      twitterDescription: dbSettings.twitter_description || '',
      twitterImage: dbSettings.twitter_image || ''
    };
  } catch (error) {
    console.error('Error loading settings from database:', error);
    // Return defaults on error
    return {
      siteName: 'Gemsutopia',
      siteFavicon: '/favicon.ico',
      enableShipping: true,
      shippingRates: [],
      internationalShipping: true,
      enableTaxes: true,
      taxRate: 13.0,
      taxExemptStates: [],
      stripeEnabled: true,
      paypalEnabled: true,
      cryptoEnabled: true,
      baseCurrency: 'CAD',
      supportedCurrencies: ['CAD', 'USD', 'EUR'],
      seoTitle: 'Gemsutopia - Premium Gemstone Collection',
      seoDescription: 'Hi, I\'m Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...',
      seoKeywords: 'gemstones, jewelry, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing',
      seoAuthor: 'Gemsutopia',
      openGraphTitle: '',
      openGraphDescription: '',
      openGraphImage: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: ''
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // Simple token check - in production, verify against database
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Settings GET request - loading from database');
    const settings = await loadSettingsFromDB();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // Simple token check - in production, verify against database
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const updates = await request.json();
    
    // Load current settings from database
    const currentSettings = await loadSettingsFromDB();
    const updatedSettings = { ...currentSettings, ...updates };
    
    // Prepare database updates
    const dbUpdates: Record<string, string> = {};
    
    // Map frontend field names to database keys for persistent fields
    if (updates.siteName !== undefined) dbUpdates.site_name = updates.siteName;
    if (updates.siteFavicon !== undefined) dbUpdates.site_favicon = updates.siteFavicon;
    if (updates.seoTitle !== undefined) dbUpdates.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) dbUpdates.seo_description = updates.seoDescription;
    if (updates.seoKeywords !== undefined) dbUpdates.seo_keywords = updates.seoKeywords;
    if (updates.seoAuthor !== undefined) dbUpdates.seo_author = updates.seoAuthor;
    if (updates.openGraphTitle !== undefined) dbUpdates.open_graph_title = updates.openGraphTitle;
    if (updates.openGraphDescription !== undefined) dbUpdates.open_graph_description = updates.openGraphDescription;
    if (updates.openGraphImage !== undefined) dbUpdates.open_graph_image = updates.openGraphImage;
    if (updates.twitterTitle !== undefined) dbUpdates.twitter_title = updates.twitterTitle;
    if (updates.twitterDescription !== undefined) dbUpdates.twitter_description = updates.twitterDescription;
    if (updates.twitterImage !== undefined) dbUpdates.twitter_image = updates.twitterImage;
    
    // Save to database
    if (Object.keys(dbUpdates).length > 0) {
      const dbSuccess = await setMultipleSettings(dbUpdates);
      if (!dbSuccess) {
        console.error('Failed to save settings to database');
        return NextResponse.json({ success: false, error: 'Failed to save settings to database' }, { status: 500 });
      }
    }
    
    // Update site info if general fields changed (this now saves to database)
    const generalFields = ['siteName', 'siteFavicon'];
    if (generalFields.some(field => updates[field] !== undefined)) {
      const siteInfoSuccess = await updateSiteInfo({
        siteName: updatedSettings.siteName,
        siteFavicon: updatedSettings.siteFavicon,
      });
      
      if (!siteInfoSuccess) {
        console.error('Failed to update site info');
      }
    }
    
    // Update SEO metadata if relevant fields changed
    const seoFields = ['seoTitle', 'seoDescription', 'seoKeywords', 'seoAuthor', 
                      'openGraphTitle', 'openGraphDescription', 'openGraphImage',
                      'twitterTitle', 'twitterDescription', 'twitterImage'];
    
    if (seoFields.some(field => updates[field] !== undefined)) {
      updateSEOMetadata({
        seoTitle: updatedSettings.seoTitle,
        seoDescription: updatedSettings.seoDescription,
        seoKeywords: updatedSettings.seoKeywords,
        seoAuthor: updatedSettings.seoAuthor,
        openGraphTitle: updatedSettings.openGraphTitle,
        openGraphDescription: updatedSettings.openGraphDescription,
        openGraphImage: updatedSettings.openGraphImage,
        twitterTitle: updatedSettings.twitterTitle,
        twitterDescription: updatedSettings.twitterDescription,
        twitterImage: updatedSettings.twitterImage,
      });
    }

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}