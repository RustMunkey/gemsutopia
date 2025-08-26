import { NextRequest, NextResponse } from 'next/server';
import { 
  getDiscountCodes, 
  createDiscountCode, 
  updateDiscountCode, 
  deleteDiscountCode,
  DiscountCode 
} from '@/lib/database/discountCodesServer';
import { requireAdmin, rateLimit, validateAndSanitize } from '@/lib/auth/adminAuth';

// 🔐 SECURE handlers with proper security
async function getDiscountCodesHandler(request: NextRequest) {
  try {
    const codes = await getDiscountCodes();
    return NextResponse.json({ 
      success: true, 
      data: codes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json({
      error: 'Failed to fetch discount codes',
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
}

async function postDiscountCodesHandler(request: NextRequest) {
  try {
    const discountData: Omit<DiscountCode, 'id' | 'used_count'> = await request.json();
    
    // Validation
    if (!discountData.code || !discountData.discount_type || !discountData.discount_value) {
      return NextResponse.json({
        error: 'Missing required fields: code, discount_type, discount_value',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }
    
    if (discountData.code.length > 50) {
      return NextResponse.json({
        error: 'Discount code must be 50 characters or less',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }
    
    const newCode = await createDiscountCode(discountData);
    return NextResponse.json({ 
      success: true, 
      data: newCode,
      message: 'Discount code created successfully'
    });
  } catch (error) {
    console.error('Error creating discount code:', error);
    return NextResponse.json({
      error: 'Failed to create discount code',
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
}

async function putDiscountCodesHandler(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json({
        error: 'Valid discount code ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }
    
    const updatedCode = await updateDiscountCode(id, updateData);
    return NextResponse.json({ 
      success: true, 
      data: updatedCode,
      message: 'Discount code updated successfully'
    });
  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json({
      error: 'Failed to update discount code',
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
}

async function deleteDiscountCodesHandler(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id || typeof id !== 'number') {
      return NextResponse.json({
        error: 'Valid discount code ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }
    
    await deleteDiscountCode(id);
    return NextResponse.json({ 
      success: true,
      message: 'Discount code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json({
      error: 'Failed to delete discount code',
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
}

// Apply bulletproof security to all endpoints
export const GET = rateLimit(50, 15 * 60 * 1000)(requireAdmin(getDiscountCodesHandler));
export const POST = rateLimit(10, 15 * 60 * 1000)(validateAndSanitize(requireAdmin(postDiscountCodesHandler)));
export const PUT = rateLimit(20, 15 * 60 * 1000)(validateAndSanitize(requireAdmin(putDiscountCodesHandler)));
export const DELETE = rateLimit(5, 15 * 60 * 1000)(requireAdmin(deleteDiscountCodesHandler));