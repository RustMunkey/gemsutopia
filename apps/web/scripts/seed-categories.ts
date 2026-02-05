import { db, categories } from '../src/lib/db';

const gemCategories = [
  {
    name: 'Sapphires',
    slug: 'sapphires',
    description: 'Stunning blue gems known for their brilliance and durability',
    image: '/images/products/gem.png',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Rubies',
    slug: 'rubies',
    description: 'Deep red treasures symbolizing passion and love',
    image: '/images/products/gem2.png',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Emeralds',
    slug: 'emeralds',
    description: 'Vivid green beauties representing rebirth and renewal',
    image: '/images/products/gem3.png',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Diamonds',
    slug: 'diamonds',
    description: 'Brilliant sparkle and timeless elegance',
    image: '/images/products/gem4.png',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Opals',
    slug: 'opals',
    description: 'Colorful fire with mesmerizing play of colors',
    image: '/images/products/gem5.png',
    sortOrder: 5,
    isActive: true,
  },
  {
    name: 'Amethyst',
    slug: 'amethyst',
    description: 'Royal purple quartz with calming energy',
    image: '/images/products/gem6.png',
    sortOrder: 6,
    isActive: true,
  },
  {
    name: 'Topaz',
    slug: 'topaz',
    description: 'Golden glow available in many stunning colors',
    image: '/images/products/gem7.png',
    sortOrder: 7,
    isActive: true,
  },
  {
    name: 'Aquamarine',
    slug: 'aquamarine',
    description: 'Ocean blue serenity in crystalline form',
    image: '/images/products/gem8.png',
    sortOrder: 8,
    isActive: true,
  },
];

async function seed() {
  console.log('Seeding categories...');

  for (const cat of gemCategories) {
    try {
      const [inserted] = await db
        .insert(categories)
        .values(cat)
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: cat.name,
            description: cat.description,
            image: cat.image,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive,
          },
        })
        .returning();

      console.log(`✓ ${inserted.name}`);
    } catch (error) {
      console.error(`✗ Failed to insert ${cat.name}:`, error);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

seed();
