import { getAllSettings } from '../database/siteSettings';

export interface SEOMetadata {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoAuthor: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  siteName: string;
  siteUrl: string;
}

const defaults: SEOMetadata = {
  seoTitle: 'Gemsutopia - Authentic Gemstones from Alberta',
  seoDescription:
    "Hi, I'm Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally verified for quality.",
  seoKeywords:
    'gemstones, crystals, amethyst, quartz, minerals, Alberta gems, Canadian gemstones, natural crystals, hand-mined, ethical sourcing',
  seoAuthor: 'Gemsutopia',
  openGraphTitle: '',
  openGraphDescription: '',
  openGraphImage: '/logos/gems-logo.png',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '/logos/gems-logo.png',
  siteName: 'Gemsutopia',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsutopia.com',
};

// In-memory cache for client-side updates
let seoCache: SEOMetadata | null = null;

// Fetch SEO settings from database (for server-side rendering)
export async function getSEOMetadataFromDB(): Promise<SEOMetadata> {
  try {
    const dbSettings = await getAllSettings();

    return {
      seoTitle: dbSettings.seo_title || defaults.seoTitle,
      seoDescription: dbSettings.seo_description || defaults.seoDescription,
      seoKeywords: dbSettings.seo_keywords || defaults.seoKeywords,
      seoAuthor: dbSettings.seo_author || defaults.seoAuthor,
      openGraphTitle: dbSettings.open_graph_title || defaults.openGraphTitle,
      openGraphDescription: dbSettings.open_graph_description || defaults.openGraphDescription,
      openGraphImage: dbSettings.open_graph_image || defaults.openGraphImage,
      twitterTitle: dbSettings.twitter_title || defaults.twitterTitle,
      twitterDescription: dbSettings.twitter_description || defaults.twitterDescription,
      twitterImage: dbSettings.twitter_image || defaults.twitterImage,
      siteName: dbSettings.site_name || defaults.siteName,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || defaults.siteUrl,
    };
  } catch {
    return defaults;
  }
}

// Sync getter for client-side (returns cached or defaults)
export function getSEOMetadata(): SEOMetadata {
  return seoCache || defaults;
}

// Update in-memory cache (called after admin updates)
export function updateSEOMetadata(updates: Partial<SEOMetadata>) {
  seoCache = { ...(seoCache || defaults), ...updates };
}

// Get defaults (useful for fallbacks)
export function getSEODefaults(): SEOMetadata {
  return defaults;
}
