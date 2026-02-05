import { NextRequest } from 'next/server';
import { db, faq } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';
import { invalidateContentCaches } from '@/lib/cache';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, getJWTSecret());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const faqItems = await db.query.faq.findMany({
      orderBy: [asc(faq.sortOrder)],
    });

    // Map to snake_case for API response compatibility
    const mappedFaq = faqItems.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category,
      sort_order: item.sortOrder,
      is_active: item.isActive,
      is_featured: item.isFeatured,
      view_count: item.viewCount,
      helpful_count: item.helpfulCount,
      not_helpful_count: item.notHelpfulCount,
      metadata: item.metadata,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    return apiSuccess({ faq: mappedFaq });
  } catch {
    return ApiError.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const body = await request.json();
    const { question, answer, sort_order, is_active, category } = body;

    if (!question || !answer) {
      return ApiError.validation('Question and answer are required');
    }

    const [newFaq] = await db
      .insert(faq)
      .values({
        question,
        answer,
        category: category || 'general',
        sortOrder: sort_order || 0,
        isActive: is_active !== undefined ? is_active : true,
      })
      .returning();

    if (!newFaq) {
      return ApiError.database('Failed to create FAQ');
    }

    // Invalidate FAQ cache
    await invalidateContentCaches('faq');

    // Map to snake_case for response
    const mappedFaq = {
      id: newFaq.id,
      question: newFaq.question,
      answer: newFaq.answer,
      category: newFaq.category,
      sort_order: newFaq.sortOrder,
      is_active: newFaq.isActive,
      is_featured: newFaq.isFeatured,
      created_at: newFaq.createdAt,
      updated_at: newFaq.updatedAt,
    };

    return apiSuccess({ faqItem: mappedFaq }, 'FAQ created successfully', 201);
  } catch {
    return ApiError.internal();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const body = await request.json();
    const { id, question, answer, sort_order, is_active, category } = body;

    if (!id) {
      return ApiError.validation('Missing FAQ ID');
    }

    const updateData: Partial<typeof faq.$inferInsert> = {};
    if (question !== undefined) updateData.question = question;
    if (answer !== undefined) updateData.answer = answer;
    if (category !== undefined) updateData.category = category;
    if (sort_order !== undefined) updateData.sortOrder = sort_order;
    if (is_active !== undefined) updateData.isActive = is_active;

    const [updated] = await db.update(faq).set(updateData).where(eq(faq.id, id)).returning();

    if (!updated) {
      return ApiError.notFound('FAQ');
    }

    // Invalidate FAQ cache
    await invalidateContentCaches('faq');

    // Map to snake_case for response
    const mappedFaq = {
      id: updated.id,
      question: updated.question,
      answer: updated.answer,
      category: updated.category,
      sort_order: updated.sortOrder,
      is_active: updated.isActive,
      is_featured: updated.isFeatured,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    };

    return apiSuccess({ faqItem: mappedFaq }, 'FAQ updated successfully');
  } catch {
    return ApiError.internal();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiError.validation('Missing FAQ ID');
    }

    await db.delete(faq).where(eq(faq.id, id));

    // Invalidate FAQ cache
    await invalidateContentCaches('faq');

    return apiSuccess(null, 'FAQ deleted successfully');
  } catch {
    return ApiError.internal();
  }
}
