import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings } from '@/lib/database/siteSettings';

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
      singleItemShippingCAD: parseFloat(dbSettings.single_item_shipping_cad) || 18.50,
      singleItemShippingUSD: parseFloat(dbSettings.single_item_shipping_usd) || 14.50,
      combinedShippingCAD: parseFloat(dbSettings.combined_shipping_cad) || 20.00,
      combinedShippingUSD: parseFloat(dbSettings.combined_shipping_usd) || 15.50,
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