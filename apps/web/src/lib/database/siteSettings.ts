import { db, siteSettings } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface SiteSetting {
  id?: string;
  key: string;
  value: string;
  type?: string;
  category?: string;
  label?: string;
  description?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Get a specific setting value
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

// Get all settings as key-value pairs
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

// Set or update a setting
export async function setSetting(key: string, value: string): Promise<boolean> {
  try {
    // Check if setting exists
    const existing = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });

    if (existing) {
      await db
        .update(siteSettings)
        .set({
          value: value,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({
        key,
        value: value,
      });
    }

    return true;
  } catch {
    return false;
  }
}

// Set multiple settings at once
export async function setMultipleSettings(settingsMap: Record<string, string>): Promise<boolean> {
  try {
    for (const [key, value] of Object.entries(settingsMap)) {
      await setSetting(key, value);
    }
    return true;
  } catch {
    return false;
  }
}

// Delete a setting
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await db.delete(siteSettings).where(eq(siteSettings.key, key));
    return true;
  } catch {
    return false;
  }
}

// Initialize default settings if they don't exist
export async function initializeDefaultSettings(): Promise<void> {
  const defaults = {
    site_name: 'Gemsutopia',
    site_favicon: '/favicon.ico',
    seo_title: 'Gemsutopia - Premium Gemstone Collection',
    seo_description:
      "Hi, I'm Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...",
    seo_keywords:
      'gemstones, minerals, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing',
    seo_author: 'Gemsutopia',
  };

  try {
    // Check if any settings exist
    const existingSettings = await getAllSettings();

    // Only set defaults that don't already exist
    const settingsToSet: Record<string, string> = {};
    Object.entries(defaults).forEach(([key, value]) => {
      if (!existingSettings[key]) {
        settingsToSet[key] = value;
      }
    });

    if (Object.keys(settingsToSet).length > 0) {
      await setMultipleSettings(settingsToSet);
    }
  } catch {
    // Error initializing default settings
  }
}
