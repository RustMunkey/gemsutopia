import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { loyaltyTiers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// Default loyalty tiers for Gemsutopia
const DEFAULT_TIERS = [
  {
    name: 'Bronze',
    slug: 'bronze',
    minSpend: '0',
    minOrders: 0,
    discountPercent: '0',
    freeShipping: false,
    freeShippingThreshold: null,
    prioritySupport: false,
    earlyAccess: false,
    birthdayBonus: null,
    color: '#CD7F32',
    icon: 'gem',
    description: 'Welcome to Gemsutopia! Start your gemstone journey.',
    benefits: ['Access to exclusive sales', 'Order tracking', 'Wishlist features'],
    sortOrder: 0,
    isActive: true,
    isDefault: true,
  },
  {
    name: 'Silver',
    slug: 'silver',
    minSpend: '500',
    minOrders: 2,
    discountPercent: '5',
    freeShipping: false,
    freeShippingThreshold: '150',
    prioritySupport: false,
    earlyAccess: false,
    birthdayBonus: '10',
    color: '#C0C0C0',
    icon: 'gem',
    description: 'Thank you for your loyalty! Enjoy enhanced benefits.',
    benefits: [
      '5% discount on all orders',
      'Free shipping on orders over $150',
      '$10 birthday bonus',
      'Early access to seasonal sales',
    ],
    sortOrder: 1,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Gold',
    slug: 'gold',
    minSpend: '2000',
    minOrders: 5,
    discountPercent: '10',
    freeShipping: true,
    freeShippingThreshold: '100',
    prioritySupport: true,
    earlyAccess: true,
    birthdayBonus: '25',
    color: '#FFD700',
    icon: 'gem',
    description: 'Our valued Gold members receive premium benefits.',
    benefits: [
      '10% discount on all orders',
      'Free shipping on orders over $100',
      'Priority customer support',
      'Early access to new products',
      '$25 birthday bonus',
      'Exclusive Gold member events',
    ],
    sortOrder: 2,
    isActive: true,
    isDefault: false,
  },
  {
    name: 'Platinum',
    slug: 'platinum',
    minSpend: '5000',
    minOrders: 10,
    discountPercent: '15',
    freeShipping: true,
    freeShippingThreshold: null, // Always free shipping
    prioritySupport: true,
    earlyAccess: true,
    birthdayBonus: '50',
    color: '#E5E4E2',
    icon: 'crown',
    description: 'Our elite Platinum members enjoy the best of Gemsutopia.',
    benefits: [
      '15% discount on all orders',
      'Free shipping on ALL orders',
      'VIP priority customer support',
      'First access to new collections',
      '$50 birthday bonus',
      'Exclusive Platinum member events',
      'Personal gemstone consultant',
    ],
    sortOrder: 3,
    isActive: true,
    isDefault: false,
  },
];

// POST - Seed default loyalty tiers
export async function POST(request: NextRequest) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if tiers already exist
    const existingTiers = await db.query.loyaltyTiers.findMany();

    if (existingTiers.length > 0 && !force) {
      return ApiError.validation(
        'Loyalty tiers already exist. Use ?force=true to replace them.'
      );
    }

    // If forcing, delete existing tiers (only if no customers assigned)
    if (force && existingTiers.length > 0) {
      // This will fail if there are customers assigned to tiers due to FK constraint
      // The admin should manually reassign customers first
      try {
        for (const tier of existingTiers) {
          await db.delete(loyaltyTiers).where(eq(loyaltyTiers.id, tier.id));
        }
      } catch (error) {
        return ApiError.validation(
          'Cannot delete existing tiers with customers assigned. Please reassign customers first.'
        );
      }
    }

    // Insert default tiers
    const insertedTiers = [];
    for (const tier of DEFAULT_TIERS) {
      const [inserted] = await db.insert(loyaltyTiers).values(tier).returning();
      insertedTiers.push(inserted);
    }

    return apiSuccess(
      { tiers: insertedTiers },
      `Successfully created ${insertedTiers.length} loyalty tiers`,
      201
    );
  } catch (error) {
    console.error('Error seeding loyalty tiers:', error);
    return ApiError.internal('Failed to seed loyalty tiers');
  }
}
