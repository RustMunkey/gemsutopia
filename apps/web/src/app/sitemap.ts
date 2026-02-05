import { MetadataRoute } from 'next';
import { db, products, categories } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Force dynamic rendering (not prerendered at build time)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsutopia.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch products for dynamic pages
  const activeProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
    columns: { id: true, updatedAt: true },
  });

  const productPages: MetadataRoute.Sitemap = activeProducts.map(product => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(product.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Fetch categories for dynamic pages
  const activeCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    columns: { slug: true, updatedAt: true },
  });

  const categoryPages: MetadataRoute.Sitemap = activeCategories.map(category => ({
    url: `${baseUrl}/products?category=${category.slug}`,
    lastModified: new Date(category.updatedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
