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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ fieldId: string }> }
) {
  const params = await context.params;
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { value } = await request.json();

    const { data, error } = await supabase
      .from('site_content')
      .update({ 
        value,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.fieldId)
      .select()
      .single();

    if (error) {
      console.error('Error updating page content:', error);
      return NextResponse.json({ error: 'Failed to update page content' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/pages/content/[fieldId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fieldId: string }> }
) {
  const params = await context.params;
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .from('site_content')
      .delete()
      .eq('id', params.fieldId);

    if (error) {
      console.error('Error deleting page content:', error);
      return NextResponse.json({ error: 'Failed to delete page content' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/pages/content/[fieldId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}