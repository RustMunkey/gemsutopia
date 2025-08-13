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

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { section, key, value } = await request.json();

    if (!section || !key) {
      return NextResponse.json({ error: 'Section and key are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('site_content')
      .insert([{
        section,
        key,
        content_type: 'text',
        value: value || ''
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating page content:', error);
      return NextResponse.json({ error: 'Failed to create page content' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/pages/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}