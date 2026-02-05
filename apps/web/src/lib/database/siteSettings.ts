import { db, siteSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Get a specific setting value (read-only)
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });

    if (!setting) {
      return null;
    }

    // Value is stored as JSONB, extract the string value
    const value = setting.value;
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object' && 'value' in value) {
      return String((value as { value: unknown }).value);
    }
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

// Get all settings as key-value pairs (read-only)
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const allSettings = await db.query.siteSettings.findMany();

    const settings: Record<string, string> = {};
    allSettings.forEach(setting => {
      const value = setting.value;
      if (typeof value === 'string') {
        settings[setting.key] = value;
      } else if (value && typeof value === 'object' && 'value' in value) {
        settings[setting.key] = String((value as { value: unknown }).value);
      } else {
        settings[setting.key] = JSON.stringify(value);
      }
    });

    return settings;
  } catch {
    return {};
  }
}

// Admin write operations (setSetting, deleteSetting, etc.) moved to JetBeans BaaS
