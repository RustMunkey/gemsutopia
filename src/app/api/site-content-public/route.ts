import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('Fetching public site content...');

    const { data: content, error } = await supabase
      .from('site_content')
      .select('id, section, key, content_type, value, is_active')
      .eq('is_active', true)
      .order('section', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to fetch content from database',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log(`Fetched ${content?.length || 0} content items`);

    return NextResponse.json({
      success: true,
      content: content || [],
      count: content?.length || 0
    });

  } catch (error) {
    console.error('Error fetching public content:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Disable caching to always get fresh content
export const dynamic = 'force-dynamic';