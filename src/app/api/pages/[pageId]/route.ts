import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  const params = await context.params;
  try {
    const { data: pageContent, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('section', params.pageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching page content:', error);
      return NextResponse.json({ error: 'Failed to fetch page content' }, { status: 500 });
    }

    // Convert array to key-value object for easier use in components
    const contentMap = (pageContent || []).reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json(contentMap);
  } catch (error) {
    console.error('Error in GET /api/pages/[pageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}