// Shared SEO metadata storage (would be database in production)
let seoMetadata = {
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

export function getSEOMetadata() {
  return seoMetadata;
}

export function updateSEOMetadata(updates: Partial<typeof seoMetadata>) {
  seoMetadata = { ...seoMetadata, ...updates };
}