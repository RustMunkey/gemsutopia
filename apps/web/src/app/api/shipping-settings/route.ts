import { NextRequest } from 'next/server';
import { getAllSettings, setMultipleSettings } from '@/lib/database/siteSettings';
import { apiSuccess, ApiError } from '@/lib/api';

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
      internationalShipping,
    } = body;

    // Validate the data
    if (
      singleItemShippingCAD == null ||
      singleItemShippingUSD == null ||
      combinedShippingCAD == null ||
      combinedShippingUSD == null
    ) {
      return ApiError.validation('Missing required shipping rates');
    }

    // Save all shipping settings to database
    const settingsToSave = {
      single_item_shipping_cad: singleItemShippingCAD.toString(),
      single_item_shipping_usd: singleItemShippingUSD.toString(),
      combined_shipping_cad: combinedShippingCAD.toString(),
      combined_shipping_usd: combinedShippingUSD.toString(),
      combined_shipping_enabled: combinedShippingEnabled ? 'true' : 'false',
      combined_shipping_threshold: (combinedShippingThreshold || 2).toString(),
      enable_shipping: enableShipping !== false ? 'true' : 'false',
      international_shipping: internationalShipping !== false ? 'true' : 'false',
    };

    const success = await setMultipleSettings(settingsToSave);

    if (!success) {
      return ApiError.database('Failed to save settings');
    }

    return apiSuccess(null, 'Shipping settings saved successfully');
  } catch {
    return ApiError.internal('Failed to save shipping settings');
  }
}
