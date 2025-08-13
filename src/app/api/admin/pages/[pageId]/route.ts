import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  const params = await context.params;
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    return NextResponse.json(pageContent || []);
  } catch (error) {
    console.error('Error in GET /api/admin/pages/[pageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}