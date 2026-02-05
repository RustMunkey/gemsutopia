import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { refundRequests, orders, payments, storeCredits, storeCreditTransactions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import Stripe from 'stripe';

// Lazy initialize Stripe to avoid module evaluation errors during build
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  });
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single refund request details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { id } = await context.params;

    const refundRequest = await db.query.refundRequests.findFirst({
      where: eq(refundRequests.id, id),
    });

    if (!refundRequest) {
      return ApiError.notFound('Refund request');
    }

    // Get associated order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, refundRequest.orderId),
    });

    // Get associated payment
    const payment = order
      ? await db.query.payments.findFirst({
          where: eq(payments.orderId, order.id),
        })
      : null;

    return apiSuccess({
      refundRequest,
      order,
      payment,
    });
  } catch (error) {
    console.error('Error fetching refund request:', error);
    return ApiError.internal('Failed to fetch refund request');
  }
}

// PUT - Update refund request status (approve/deny/process)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { id } = await context.params;
    const body = await request.json();
    const {
      status,
      adminNotes,
      denialReason,
      approvedAmount,
      refundMethod, // 'original_payment' or 'store_credit'
    } = body;

    // Get the refund request
    const refundRequest = await db.query.refundRequests.findFirst({
      where: eq(refundRequests.id, id),
    });

    if (!refundRequest) {
      return ApiError.notFound('Refund request');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (denialReason !== undefined) updateData.denialReason = denialReason;
    if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount.toString();
    if (refundMethod) updateData.refundMethod = refundMethod;

    // If approving/denying, set review timestamp and reviewer
    if (status === 'approved' || status === 'denied') {
      updateData.reviewedAt = new Date().toISOString();
      if (adminVerified.email) {
        const adminUser = await db.query.users.findFirst({
          where: eq(users.email, adminVerified.email),
          columns: { id: true },
        });
        if (adminUser) {
          updateData.reviewedBy = adminUser.id;
        }
      }
    }

    // If status is 'refunded', process the actual refund
    if (status === 'refunded') {
      const amountToRefund = approvedAmount || refundRequest.approvedAmount || refundRequest.requestedAmount;
      const method = refundMethod || refundRequest.refundMethod || 'original_payment';

      // Get the order and payment
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, refundRequest.orderId),
      });

      if (!order) {
        return ApiError.notFound('Order');
      }

      if (method === 'original_payment') {
        // Process refund through payment provider
        const payment = await db.query.payments.findFirst({
          where: eq(payments.orderId, order.id),
        });

        if (payment && payment.provider === 'stripe' && payment.providerPaymentId) {
          try {
            // Create Stripe refund
            const refund = await getStripe().refunds.create({
              payment_intent: payment.providerPaymentId,
              amount: Math.round(Number(amountToRefund) * 100), // Convert to cents
            });

            updateData.providerRefundId = refund.id;

            // Update payment record
            await db
              .update(payments)
              .set({
                refundAmount: amountToRefund.toString(),
                refundReason: refundRequest.reason,
                refundedAt: new Date().toISOString(),
                status: 'refunded',
                updatedAt: new Date().toISOString(),
              })
              .where(eq(payments.id, payment.id));
          } catch (stripeError) {
            console.error('Stripe refund error:', stripeError);
            return ApiError.internal('Failed to process Stripe refund');
          }
        } else if (payment && payment.provider === 'paypal' && payment.providerPaymentId) {
          try {
            const paypalAccessToken = await getPayPalAccessToken();
            const captureId = payment.providerPaymentId;

            const refundBody: Record<string, unknown> = {
              amount: {
                value: Number(amountToRefund).toFixed(2),
                currency_code: order.currency || 'CAD',
              },
              note_to_payer: `Refund for order #${order.orderNumber}`,
            };

            const refundResponse = await fetch(
              `https://api.paypal.com/v2/payments/captures/${captureId}/refund`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${paypalAccessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(refundBody),
              }
            );

            if (!refundResponse.ok) {
              const errorData = await refundResponse.json().catch(() => ({}));
              console.error('PayPal refund error:', errorData);
              return ApiError.internal(
                `Failed to process PayPal refund: ${(errorData as Record<string, string>).message || 'Unknown error'}`
              );
            }

            const refundData = await refundResponse.json();
            updateData.providerRefundId = refundData.id;

            // Update payment record
            await db
              .update(payments)
              .set({
                refundAmount: amountToRefund.toString(),
                refundReason: refundRequest.reason,
                refundedAt: new Date().toISOString(),
                status: 'refunded',
                updatedAt: new Date().toISOString(),
              })
              .where(eq(payments.id, payment.id));
          } catch (paypalError) {
            console.error('PayPal refund error:', paypalError);
            return ApiError.internal('Failed to process PayPal refund');
          }
        }
      } else if (method === 'store_credit') {
        // Add store credit
        const email = order.customerEmail;

        // Get or create store credit account
        let storeCredit = await db.query.storeCredits.findFirst({
          where: eq(storeCredits.email, email),
        });

        if (!storeCredit) {
          const [newCredit] = await db
            .insert(storeCredits)
            .values({
              email,
              userId: order.userId,
              balance: '0',
              totalEarned: '0',
              totalUsed: '0',
            })
            .returning();
          storeCredit = newCredit;
        }

        // Calculate new balance
        const newBalance = Number(storeCredit.balance) + Number(amountToRefund);
        const newTotalEarned = Number(storeCredit.totalEarned) + Number(amountToRefund);

        // Update store credit
        await db
          .update(storeCredits)
          .set({
            balance: newBalance.toString(),
            totalEarned: newTotalEarned.toString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(storeCredits.id, storeCredit.id));

        // Create transaction record
        await db.insert(storeCreditTransactions).values({
          storeCreditId: storeCredit.id,
          type: 'earn',
          amount: amountToRefund.toString(),
          balanceAfter: newBalance.toString(),
          source: 'order_refund',
          sourceId: refundRequest.id,
          description: `Refund for order #${order.orderNumber}`,
          orderId: order.id,
        });
      }

      // Update order status
      await db
        .update(orders)
        .set({
          status: 'refunded',
          paymentStatus: Number(amountToRefund) >= Number(order.total) ? 'refunded' : 'partially_refunded',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order.id));

      updateData.refundedAt = new Date().toISOString();
    }

    // Update the refund request
    const [updated] = await db
      .update(refundRequests)
      .set(updateData)
      .where(eq(refundRequests.id, id))
      .returning();

    return apiSuccess({ refundRequest: updated }, 'Refund request updated');
  } catch (error) {
    console.error('Error updating refund request:', error);
    return ApiError.internal('Failed to update refund request');
  }
}
