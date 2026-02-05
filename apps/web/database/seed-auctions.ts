/**
 * Auction Seeding Script
 *
 * Run this script to clear fake auctions and add new live auctions:
 *   npx tsx database/seed-auctions.ts
 *
 * Or via pnpm:
 *   pnpm tsx database/seed-auctions.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Sample auction data - customize as needed
const sampleAuctions = [
  {
    title: 'Natural Blue Sapphire',
    description: '<p>A stunning natural blue sapphire from Ceylon (Sri Lanka). This gem displays exceptional brilliance with a rich, vivid blue color. Eye-clean clarity with excellent cut proportions. Perfect for a statement ring or pendant.</p>',
    images: ['/images/products/gem.png', '/images/products/gem2.png'],
    starting_bid: 250.00,
    reserve_price: 500.00,
    bid_increment: 25.00,
    // Ends in 7 days
    duration_days: 7,
    gemstone_type: 'Sapphire',
    carat_weight: 2.35,
    cut: 'Oval',
    clarity: 'Eye Clean',
    color: 'Vivid Blue',
    origin: 'Sri Lanka',
  },
  {
    title: 'Emerald Cut Diamond',
    description: '<p>Exceptional emerald cut diamond with VS1 clarity and E color grade. This diamond exhibits remarkable transparency and a hall-of-mirrors effect typical of step cuts. GIA certified.</p>',
    images: ['/images/products/gem3.png', '/images/products/gem4.png'],
    starting_bid: 1500.00,
    reserve_price: 3000.00,
    bid_increment: 100.00,
    duration_days: 5,
    gemstone_type: 'Diamond',
    carat_weight: 1.52,
    cut: 'Emerald',
    clarity: 'VS1',
    color: 'E',
    origin: 'Botswana',
    certification: 'GIA',
  },
  {
    title: 'Rare Padparadscha Sapphire',
    description: '<p>Extremely rare Padparadscha sapphire displaying the coveted pink-orange sunset color. Untreated and certified. A true collector\'s gemstone.</p>',
    images: ['/images/products/gem5.png', '/images/products/gem.png'],
    starting_bid: 800.00,
    reserve_price: 1800.00,
    bid_increment: 50.00,
    duration_days: 10,
    gemstone_type: 'Sapphire',
    carat_weight: 1.87,
    cut: 'Cushion',
    clarity: 'Eye Clean',
    color: 'Pink-Orange',
    origin: 'Sri Lanka',
    treatment: 'None (Natural)',
  },
  {
    title: 'Colombian Emerald',
    description: '<p>Fine Colombian emerald with characteristic jardin inclusions and exceptional green color saturation. Minor oil treatment. Ideal for a classic emerald ring.</p>',
    images: ['/images/products/gem2.png', '/images/products/gem3.png'],
    starting_bid: 450.00,
    reserve_price: 900.00,
    bid_increment: 25.00,
    duration_days: 6,
    gemstone_type: 'Emerald',
    carat_weight: 1.95,
    cut: 'Octagonal',
    clarity: 'Moderately Included',
    color: 'Vivid Green',
    origin: 'Colombia',
    treatment: 'Minor Oil',
  },
  {
    title: 'Burmese Ruby',
    description: '<p>Exceptional Burmese ruby with the sought-after "pigeon blood" red color. Strong fluorescence adds to its fiery appearance. A true investment-grade gemstone.</p>',
    images: ['/images/products/gem4.png', '/images/products/gem5.png'],
    starting_bid: 2000.00,
    reserve_price: 5000.00,
    bid_increment: 200.00,
    duration_days: 14,
    gemstone_type: 'Ruby',
    carat_weight: 2.10,
    cut: 'Oval',
    clarity: 'Eye Clean',
    color: 'Pigeon Blood Red',
    origin: 'Myanmar (Burma)',
    treatment: 'Heat Treated',
  },
];

async function clearAndSeedAuctions() {
  try {
    console.log('Starting auction seeding...\n');

    // First, check existing auctions
    const existingAuctions = await sql`
      SELECT id, title, bid_count, status
      FROM auctions
      ORDER BY created_at DESC
    `;

    console.log(`Found ${existingAuctions.length} existing auctions:`);
    existingAuctions.forEach(a => {
      console.log(`  - ${a.title} (${a.status}, ${a.bid_count} bids)`);
    });

    // Delete auctions without bids
    const deleteResult = await sql`
      DELETE FROM auctions
      WHERE bid_count = 0 OR bid_count IS NULL
      RETURNING id, title
    `;

    console.log(`\nDeleted ${deleteResult.length} auctions without bids`);

    // Insert new auctions
    console.log('\nCreating new auctions...');

    const now = new Date();

    for (const auction of sampleAuctions) {
      // Start immediately, end based on duration
      const startTime = now.toISOString();
      const endTime = new Date(now.getTime() + auction.duration_days * 24 * 60 * 60 * 1000).toISOString();

      // Store extra fields in metadata
      const metadata = {
        treatment: auction.treatment || null,
        certification: auction.certification || null,
      };

      const result = await sql`
        INSERT INTO auctions (
          title, description, images,
          starting_bid, current_bid, reserve_price, bid_increment,
          start_time, end_time, status, is_active,
          gemstone_type, carat_weight, cut, clarity, color, origin, certification,
          metadata, bid_count, created_at, updated_at
        ) VALUES (
          ${auction.title},
          ${auction.description},
          ${auction.images},
          ${auction.starting_bid},
          ${auction.starting_bid},
          ${auction.reserve_price},
          ${auction.bid_increment},
          ${startTime},
          ${endTime},
          'active',
          true,
          ${auction.gemstone_type},
          ${auction.carat_weight},
          ${auction.cut},
          ${auction.clarity},
          ${auction.color},
          ${auction.origin},
          ${auction.certification || null},
          ${JSON.stringify(metadata)},
          0,
          ${now.toISOString()},
          ${now.toISOString()}
        )
        RETURNING id, title
      `;

      console.log(`  Created: ${result[0].title} (ends in ${auction.duration_days} days)`);
    }

    console.log('\nAuction seeding complete!');
    console.log('Refresh the auctions page to see the new auctions.');

  } catch (error) {
    console.error('Error seeding auctions:', error);
    process.exit(1);
  }
}

// Run the seeding
clearAndSeedAuctions();
