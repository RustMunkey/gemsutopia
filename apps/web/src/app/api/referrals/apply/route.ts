import { NextRequest } from 'next/server';
import { db, referrals, referralConversions, storeCredits, storeCreditTransactions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST /api/referrals/apply - Record a referral conversion after successful order
// This should be called after payment is confirmed
export async function POST(request: NextRequest) {
  try {
    const {
      referralId,
      orderId,
      orderTotal,
      discountApplied,
      referredEmail,
      referredName,
      referredUserId,
    } = await request.json();

    if (!referralId || !orderId || !orderTotal || !referredEmail) {
      return ApiError.validation('Missing required fields');
    }

    // Get the referral
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.id, referralId),
    });

    if (!referral) {
      return ApiError.notFound('Referral');
    }

    // Calculate referrer reward
    const rewardValue = parseFloat(referral.referrerRewardValue || '0');
    const rewardCap = referral.referrerRewardCap
      ? parseFloat(referral.referrerRewardCap)
      : null;

    let referrerReward = 0;
    if (referral.referrerRewardType === 'percentage') {
      referrerReward = (orderTotal * rewardValue) / 100;
      if (rewardCap && referrerReward > rewardCap) {
        referrerReward = rewardCap;
      }
    } else if (referral.referrerRewardType === 'fixed') {
      referrerReward = rewardValue;
    } else if (referral.referrerRewardType === 'credit') {
      // Credit-based reward
      referrerReward = rewardValue;
    }

    referrerReward = Math.round(referrerReward * 100) / 100;

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create conversion record
      const [conversion] = await tx
        .insert(referralConversions)
        .values({
          referralId,
          orderId,
          orderTotal: String(orderTotal),
          discountApplied: String(discountApplied || 0),
          referrerReward: String(referrerReward),
          referrerRewardStatus: referral.referrerRewardType === 'credit' ? 'credited' : 'pending',
          referredEmail: referredEmail.toLowerCase(),
          referredName: referredName || null,
          referredUserId: referredUserId || null,
          status: 'completed',
        })
        .returning();

      // 2. Update referral stats
      const currentRewards = parseFloat(referral.totalRewardsEarned || '0');
      await tx
        .update(referrals)
        .set({
          timesUsed: (referral.timesUsed || 0) + 1,
          totalRewardsEarned: String(currentRewards + referrerReward),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(referrals.id, referralId));

      // 3. If reward type is credit, add to referrer's store credit
      if (referral.referrerRewardType === 'credit' && referrerReward > 0) {
        // Find or create store credit account
        let storeCredit = await tx.query.storeCredits.findFirst({
          where: eq(storeCredits.email, referral.referrerEmail),
        });

        if (!storeCredit) {
          const [newCredit] = await tx
            .insert(storeCredits)
            .values({
              userId: referral.referrerId || null,
              email: referral.referrerEmail,
              balance: '0',
              totalEarned: '0',
              totalUsed: '0',
            })
            .returning();
          storeCredit = newCredit;
        }

        // Update balance
        const currentBalance = parseFloat(storeCredit.balance);
        const currentEarned = parseFloat(storeCredit.totalEarned);
        const newBalance = currentBalance + referrerReward;

        await tx
          .update(storeCredits)
          .set({
            balance: String(newBalance),
            totalEarned: String(currentEarned + referrerReward),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(storeCredits.id, storeCredit.id));

        // Log transaction
        await tx.insert(storeCreditTransactions).values({
          storeCreditId: storeCredit.id,
          type: 'earn',
          amount: String(referrerReward),
          balanceAfter: String(newBalance),
          source: 'referral',
          sourceId: conversion.id,
          description: `Referral reward from ${referredName || referredEmail}`,
        });
      }

      return conversion;
    });

    return apiSuccess({
      conversion: {
        id: result.id,
        referrerReward,
        referrerRewardStatus: result.referrerRewardStatus,
      },
    }, 'Referral conversion recorded');
  } catch (error) {
    console.error('Apply referral error:', error);
    return ApiError.internal('Failed to record referral conversion');
  }
}
