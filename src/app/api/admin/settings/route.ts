import { NextRequest, NextResponse } from 'next/server';
import { updateSEOMetadata } from '@/lib/utils/seoMetadata';
import { updateSiteInfo } from '@/lib/utils/siteInfo';
import { getAllSettings, setMultipleSettings } from '@/lib/database/siteSettings';
import { validateShippingSettings } from '@/lib/security/sanitize';

// Load settings from database
async function loadSettingsFromDB() {
  try {
    const dbSettings = await getAllSettings();
    
    // Merge with defaults
    return {
      // General Settings (from database)
      siteName: dbSettings.site_name || 'Gemsutopia',
      siteFavicon: dbSettings.site_favicon || '/favicon.ico',
      
      // Shipping Settings (from database)
      enableShipping: dbSettings.enable_shipping !== undefined ? dbSettings.enable_shipping === 'true' : true,
      shippingRates: [],
      internationalShipping: dbSettings.international_shipping !== undefined ? dbSettings.international_shipping === 'true' : true,
      singleItemShippingCAD: parseFloat(dbSettings.single_item_shipping_cad) || 0,
      singleItemShippingUSD: parseFloat(dbSettings.single_item_shipping_usd) || 0,
      combinedShippingCAD: parseFloat(dbSettings.combined_shipping_cad) || 0,
      combinedShippingUSD: parseFloat(dbSettings.combined_shipping_usd) || 0,
      combinedShippingEnabled: dbSettings.combined_shipping_enabled !== undefined ? dbSettings.combined_shipping_enabled === 'true' : true,
      combinedShippingThreshold: parseInt(dbSettings.combined_shipping_threshold) || 2,
      
      // Tax Settings  
      enableTaxes: true,
      taxRate: 13.0,
      taxExemptStates: [],
      
      // Payment Settings
      stripeEnabled: true,
      paypalEnabled: true,
      cryptoEnabled: true,
      
      // Currency Settings
      baseCurrency: dbSettings.base_currency || 'USD',
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
      singleItemShippingCAD: 0,
      singleItemShippingUSD: 0,
      combinedShippingCAD: 0,
      combinedShippingUSD: 0,
      combinedShippingEnabled: true,
      combinedShippingThreshold: 2,
      enableTaxes: true,
      taxRate: 13.0,
      taxExemptStates: [],
      stripeEnabled: true,
      paypalEnabled: true,
      cryptoEnabled: true,
      baseCurrency: 'USD',
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
    // Authentication is handled by middleware.ts - no need for redundant checks
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
    // Authentication is handled by middleware.ts - no need for redundant checks
    const rawUpdates = await request.json();
    
    // Validate and sanitize all inputs
    const validation = validateShippingSettings(rawUpdates);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid input data',
        details: validation.errors 
      }, { status: 400 });
    }
    
    const updates = validation.sanitized;
    
    // Load current settings from database
    const currentSettings = await loadSettingsFromDB();
    const updatedSettings = { ...currentSettings, ...updates };
    
    // Prepare database updates
    const dbUpdates: Record<string, string> = {};
    
    // Map frontend field names to database keys for persistent fields
    if (updates.siteName !== undefined) dbUpdates.site_name = updates.siteName;
    if (updates.siteFavicon !== undefined) dbUpdates.site_favicon = updates.siteFavicon;
    
    // Currency settings
    if (updates.baseCurrency !== undefined) dbUpdates.base_currency = updates.baseCurrency;
    
    // Shipping settings
    if (updates.enableShipping !== undefined) dbUpdates.enable_shipping = updates.enableShipping.toString();
    if (updates.internationalShipping !== undefined) dbUpdates.international_shipping = updates.internationalShipping.toString();
    if (updates.singleItemShippingCAD !== undefined) dbUpdates.single_item_shipping_cad = updates.singleItemShippingCAD.toString();
    if (updates.singleItemShippingUSD !== undefined) dbUpdates.single_item_shipping_usd = updates.singleItemShippingUSD.toString();
    if (updates.combinedShippingCAD !== undefined) dbUpdates.combined_shipping_cad = updates.combinedShippingCAD.toString();
    if (updates.combinedShippingUSD !== undefined) dbUpdates.combined_shipping_usd = updates.combinedShippingUSD.toString();
    if (updates.combinedShippingEnabled !== undefined) dbUpdates.combined_shipping_enabled = updates.combinedShippingEnabled.toString();
    if (updates.combinedShippingThreshold !== undefined) dbUpdates.combined_shipping_threshold = updates.combinedShippingThreshold.toString();
    
    // SEO settings
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