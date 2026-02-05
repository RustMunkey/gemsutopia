import { NextRequest } from 'next/server';
import { db, referrals, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Generate a unique, readable referral code
function generateReferralCode(name?: string): string {
  const prefix = name
    ? name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()
    : 'GEM';
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}

// POST /api/referrals - Create a referral code for a user
export async function POST(request: NextRequest) {
  try {
    const { email, name, userId } = await request.json();

    if (!email) {
      return ApiError.validation('Email is required');
    }

    // Check if user already has a referral code
    const existingReferral = await db.query.referrals.findFirst({
      where: eq(referrals.referrerEmail, email.toLowerCase()),
    });

    if (existingReferral) {
      // Return existing referral code
      return apiSuccess({
        referral: {
          code: existingReferral.code,
          referrerEmail: existingReferral.referrerEmail,
          timesUsed: existingReferral.timesUsed,
          totalRewardsEarned: existingReferral.totalRewardsEarned,
          isActive: existingReferral.isActive,
          createdAt: existingReferral.createdAt,
        },
        isNew: false,
      }, 'Referral code already exists');
    }

    // Generate a unique code
    let code = generateReferralCode(name);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query.referrals.findFirst({
        where: eq(referrals.code, code),
      });
      if (!existing) break;
      code = generateReferralCode(name);
      attempts++;
    }

    // Create new referral
    const [newReferral] = await db
      .insert(referrals)
      .values({
        referrerId: userId || null,
        referrerEmail: email.toLowerCase(),
        referrerName: name || null,
        code,
        // Default rewards: 10% for referrer, 10% off for referred
        referrerRewardType: 'percentage',
        referrerRewardValue: '10',
        referredDiscountType: 'percentage',
        referredDiscountValue: '10',
      })
      .returning();

    return apiSuccess({
      referral: {
        code: newReferral.code,
        referrerEmail: newReferral.referrerEmail,
        timesUsed: 0,
        totalRewardsEarned: '0',
        isActive: true,
        createdAt: newReferral.createdAt,
      },
      isNew: true,
    }, 'Referral code created', 201);
  } catch (error) {
    console.error('Create referral error:', error);
    return ApiError.internal('Failed to create referral code');
  }
}

// GET /api/referrals - Get referral stats for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return ApiError.validation('Email or userId is required');
    }

    // Find referral by email or userId
    const referral = await db.query.referrals.findFirst({
      where: email
        ? eq(referrals.referrerEmail, email.toLowerCase())
        : eq(referrals.referrerId, userId!),
      with: {
        conversions: {
          orderBy: (conversions, { desc }) => [desc(conversions.createdAt)],
          limit: 10,
        },
      },
    });

    if (!referral) {
      return apiSuccess({ referral: null }, 'No referral code found');
    }

    return apiSuccess({
      referral: {
        code: referral.code,
        referrerEmail: referral.referrerEmail,
        referrerName: referral.referrerName,
        timesUsed: referral.timesUsed,
        totalRewardsEarned: referral.totalRewardsEarned,
        referrerRewardType: referral.referrerRewardType,
        referrerRewardValue: referral.referrerRewardValue,
        referredDiscountType: referral.referredDiscountType,
        referredDiscountValue: referral.referredDiscountValue,
        isActive: referral.isActive,
        expiresAt: referral.expiresAt,
        createdAt: referral.createdAt,
        recentConversions: referral.conversions?.map(c => ({
          id: c.id,
          referredName: c.referredName || 'Anonymous',
          orderTotal: c.orderTotal,
          discountApplied: c.discountApplied,
          referrerReward: c.referrerReward,
          referrerRewardStatus: c.referrerRewardStatus,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get referral error:', error);
    return ApiError.internal('Failed to fetch referral');
  }
}
