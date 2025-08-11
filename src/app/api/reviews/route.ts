import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { name, email, rating, title, review } = await request.json();

    // Validate required fields
    if (!name || !email || !rating || !review) {
      return NextResponse.json(
        { success: false, message: 'Name, email, rating, and review are required' },
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate character limits
    if (name.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Name must be 50 characters or less' },
        { status: 400 }
      );
    }

    if (title && title.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Title must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (review.length > 120) {
      return NextResponse.json(
        { success: false, message: 'Review must be 120 characters or less' },
        { status: 400 }
      );
    }

    // Create review data
    const reviewData = {
      customer_name: name,
      customer_email: email,
      rating: parseInt(rating),
      title: title || null,
      content: review,
      is_featured: false,
      is_approved: false, // Reviews need approval before showing
      is_active: true,
      images: []
    };

    // Insert into database
    const { data: newReview, error } = await supabaseAdmin
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to submit review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// GET /api/reviews - Get all approved reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    let query = supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true);

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data: reviews, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      count: reviews?.length || 0
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}