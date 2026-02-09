import { db, storeSettings } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

const WORKSPACE_ID = process.env.WORKSPACE_ID!;

// Get a specific setting value from Quickdash store_settings
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await db.query.storeSettings.findFirst({
      where: and(
        eq(storeSettings.workspaceId, WORKSPACE_ID),
        eq(storeSettings.key, key),
      ),
    });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}

// Get all settings as key-value pairs from Quickdash store_settings
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const allSettings = await db.query.storeSettings.findMany({
      where: eq(storeSettings.workspaceId, WORKSPACE_ID),
    });

    const settings: Record<string, string> = {};
    for (const setting of allSettings) {
      if (setting.value) {
        settings[setting.key] = setting.value;
      }
    }
    return settings;
  } catch {
    return {};
  }
}

// Get settings by group from Quickdash store_settings
export async function getSettingsByGroup(group: string): Promise<Record<string, string>> {
  try {
    const groupSettings = await db.query.storeSettings.findMany({
      where: and(
        eq(storeSettings.workspaceId, WORKSPACE_ID),
        eq(storeSettings.group, group),
      ),
    });

    const settings: Record<string, string> = {};
    for (const setting of groupSettings) {
      if (setting.value) {
        settings[setting.key] = setting.value;
      }
    }
    return settings;
  } catch {
    return {};
  }
}
