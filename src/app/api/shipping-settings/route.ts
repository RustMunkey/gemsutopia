import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setMultipleSettings } from '@/lib/database/siteSettings';

/**
 * Public endpoint to get shipping settings for checkout calculations
 * No authentication required as this is needed for public cart/checkout
 */
export async function GET(request: NextRequest) {
  try {
    const dbSettings = await getAllSettings();
    
    const shippingSettings = {
      enableShipping: dbSettings.enable_shipping !== undefined ? dbSettings.enable_shipping === 'true' : true,
      internationalShipping: dbSettings.international_shipping !== undefined ? dbSettings.international_shipping === 'true' : true,
      singleItemShippingCAD: parseFloat(dbSettings.single_item_shipping_cad) || 21.00,
      singleItemShippingUSD: parseFloat(dbSettings.single_item_shipping_usd) || 15.00,
      combinedShippingCAD: parseFloat(dbSettings.combined_shipping_cad) || 25.00,
      combinedShippingUSD: parseFloat(dbSettings.combined_shipping_usd) || 18.00,
      combinedShippingEnabled: dbSettings.combined_shipping_enabled !== undefined ? dbSettings.combined_shipping_enabled === 'true' : true,
      combinedShippingThreshold: parseInt(dbSettings.combined_shipping_threshold) || 2,
    };

    return NextResponse.json({ success: true, settings: shippingSettings });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    
    // Return defaults on error - these should match admin panel settings
    const defaultSettings = {
      enableShipping: true,
      internationalShipping: true,
      singleItemShippingCAD: 21.00,
      singleItemShippingUSD: 15.00,
      combinedShippingCAD: 25.00,
      combinedShippingUSD: 18.00,
      combinedShippingEnabled: true,
      combinedShippingThreshold: 2,
    };
    
    return NextResponse.json({ success: true, settings: defaultSettings });
  }
}

/**
 * Save shipping settings from admin dashboard
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      singleItemShippingCAD,
      singleItemShippingUSD,
      combinedShippingCAD,
      combinedShippingUSD,
      combinedShippingEnabled,
      combinedShippingThreshold,
      enableShipping,
      internationalShipping
    } = body;

    // Validate the data
    if (singleItemShippingCAD == null || singleItemShippingUSD == null || 
        combinedShippingCAD == null || combinedShippingUSD == null) {
      return NextResponse.json({ success: false, error: 'Missing required shipping rates' }, { status: 400 });
    }

    // Save all shipping settings to database
    const settingsToSave = {
      single_item_shipping_cad: singleItemShippingCAD.toString(),
      single_item_shipping_usd: singleItemShippingUSD.toString(),
      combined_shipping_cad: combinedShippingCAD.toString(),
      combined_shipping_usd: combinedShippingUSD.toString(),
      combined_shipping_enabled: (combinedShippingEnabled ? 'true' : 'false'),
      combined_shipping_threshold: (combinedShippingThreshold || 2).toString(),
      enable_shipping: (enableShipping !== false ? 'true' : 'false'),
      international_shipping: (internationalShipping !== false ? 'true' : 'false')
    };

    const success = await setMultipleSettings(settingsToSave);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Shipping settings saved successfully' });

  } catch (error) {
    console.error('Error saving shipping settings:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}