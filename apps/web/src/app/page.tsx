import HomeContent from './HomeContent';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch from Jetbeans Storefront API
  let featuredProducts: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    inventory: number;
  }> = [];

  let siteSettings: {
    name: string;
    tagline: string | null;
    description: string | null;
  } = {
    name: 'Gemsutopia',
    tagline: 'Premium Gemstones',
    description: 'Discover rare and beautiful gemstones',
  };

  try {
    // Fetch featured products from Jetbeans
    const { products } = await store.products.list({ featured: true, limit: 8 });
    featuredProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      image_url: p.thumbnail || p.images?.[0] || null,
      inventory: 99, // TODO: Add inventory to storefront API
    }));
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
  }

  try {
    // Fetch site settings from Jetbeans
    const { site } = await store.site.getSettings();
    siteSettings = {
      name: site.name,
      tagline: site.tagline,
      description: site.description,
    };
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
  }

  // Default content (can be managed in Jetbeans CMS later)
  const initialContent = [
    { id: '1', section: 'hero', key: 'title', content_type: 'text', value: 'Discover Rare Gemstones', is_active: true },
    { id: '2', section: 'hero', key: 'subtitle', content_type: 'text', value: 'Ethically sourced, expertly curated', is_active: true },
    { id: '3', section: 'about', key: 'title', content_type: 'text', value: 'About Gemsutopia', is_active: true },
    { id: '4', section: 'about', key: 'description', content_type: 'text', value: 'We bring you the finest gemstones from around the world, each piece carefully selected for its beauty and quality.', is_active: true },
  ];

  // Default stats
  const initialStats = [
    { id: '1', title: 'Happy Customers', value: '1,000+' },
    { id: '2', title: 'Gemstones Sold', value: '5,000+' },
    { id: '3', title: 'Countries Shipped', value: '50+' },
  ];

  // Default testimonials
  const initialTestimonials = [
    { id: 1, name: 'Sarah M.', text: 'Absolutely stunning sapphire! The quality exceeded my expectations.', rating: 5 },
    { id: 2, name: 'James K.', text: 'Fast shipping and beautiful packaging. Will definitely order again!', rating: 5 },
    { id: 3, name: 'Emily R.', text: 'The ruby I purchased is gorgeous. Great customer service too.', rating: 5 },
  ];

  // Default FAQ
  const initialFaqItems = [
    { id: '1', question: 'Are your gemstones certified?', answer: 'Yes, all our gemstones come with certification from reputable gemological laboratories.', sort_order: 1 },
    { id: '2', question: 'What is your return policy?', answer: 'We offer a 30-day return policy for all unused items in original packaging.', sort_order: 2 },
    { id: '3', question: 'Do you ship internationally?', answer: 'Yes, we ship to over 50 countries worldwide with tracking and insurance.', sort_order: 3 },
  ];

  return (
    <HomeContent
      initialContent={initialContent}
      initialStats={initialStats}
      initialFeaturedProducts={featuredProducts}
      initialTestimonials={initialTestimonials}
      initialFaqItems={initialFaqItems}
    />
  );
}
