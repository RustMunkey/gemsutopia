import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SiteSetting {
  id?: number;
  setting_key: string;
  setting_value: string;
  updated_at?: string;
  created_at?: string;
}

// Get a specific setting value
export async function getSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - setting doesn't exist
        return null;
      }
      console.error('Error fetching setting:', error);
      return null;
    }

    return data.setting_value;
  } catch (error) {
    console.error('Error in getSetting:', error);
    return null;
  }
}

// Get all settings as key-value pairs
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('Error fetching all settings:', error);
      return {};
    }

    const settings: Record<string, string> = {};
    data?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    return settings;
  } catch (error) {
    console.error('Error in getAllSettings:', error);
    return {};
  }
}

// Set or update a setting
export async function setSetting(key: string, value: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      });

    if (error) {
      console.error('Error setting value:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setSetting:', error);
    return false;
  }
}

// Set multiple settings at once
export async function setMultipleSettings(settings: Record<string, string>): Promise<boolean> {
  try {
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('site_settings')
      .upsert(settingsArray, {
        onConflict: 'setting_key'
      });

    if (error) {
      console.error('Error setting multiple values:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setMultipleSettings:', error);
    return false;
  }
}

// Delete a setting
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .delete()
      .eq('setting_key', key);

    if (error) {
      console.error('Error deleting setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSetting:', error);
    return false;
  }
}

// Initialize default settings if they don't exist
export async function initializeDefaultSettings(): Promise<void> {
  const defaults = {
    site_name: 'Gemsutopia',
    site_favicon: '/favicon.ico',
    seo_title: 'Gemsutopia - Premium Gemstone Collection',
    seo_description: 'Hi, I\'m Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...',
    seo_keywords: 'gemstones, jewelry, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing',
    seo_author: 'Gemsutopia'
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
      console.log('Initialized default settings:', Object.keys(settingsToSet));
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}