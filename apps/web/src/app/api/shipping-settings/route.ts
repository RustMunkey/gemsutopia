import { getAllSettings } from '@/lib/database/siteSettings';
import { apiSuccess } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint to get shipping settings for checkout calculations
 * No authentication required as this is needed for public cart/checkout
 */
export async function GET() {
  try {
    const dbSettings = await getAllSettings();

    const shippingSettings = {
      enableShipping:
        dbSettings.enable_shipping !== undefined ? dbSettings.enable_shipping === 'true' : true,
      internationalShipping:
        dbSettings.international_shipping !== undefined
          ? dbSettings.international_shipping === 'true'
          : true,
      singleItemShippingCAD: parseFloat(dbSettings.single_item_shipping_cad) || 21.0,
      singleItemShippingUSD: parseFloat(dbSettings.single_item_shipping_usd) || 15.0,
      combinedShippingCAD: parseFloat(dbSettings.combined_shipping_cad) || 25.0,
      combinedShippingUSD: parseFloat(dbSettings.combined_shipping_usd) || 18.0,
      combinedShippingEnabled:
        dbSettings.combined_shipping_enabled !== undefined
          ? dbSettings.combined_shipping_enabled === 'true'
          : true,
      combinedShippingThreshold: parseInt(dbSettings.combined_shipping_threshold) || 2,
    };

    return apiSuccess({ settings: shippingSettings });
  } catch {
    // Return defaults on error - these should match admin panel settings
    const defaultSettings = {
      enableShipping: true,
      internationalShipping: true,
      singleItemShippingCAD: 21.0,
      singleItemShippingUSD: 15.0,
      combinedShippingCAD: 25.0,
      combinedShippingUSD: 18.0,
      combinedShippingEnabled: true,
      combinedShippingThreshold: 2,
    };

    return apiSuccess({ settings: defaultSettings, isDefault: true });
  }
}

// PUT /api/shipping-settings - Admin functionality moved to JetBeans BaaS
