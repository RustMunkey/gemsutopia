import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: gemFacts, error } = await supabase
      .from('gem_facts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gem facts:', error);
      return NextResponse.json({ error: 'Failed to fetch gem facts' }, { status: 500 });
    }

    return NextResponse.json(gemFacts);
  } catch (error) {
    console.error('Error in GET /api/admin/gem-facts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fact, gem_type, source, is_active } = body;

    if (!fact) {
      return NextResponse.json({ error: 'Fact is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gem_facts')
      .insert({
        fact,
        gem_type: gem_type || null,
        source: source || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gem fact:', error);
      return NextResponse.json({ error: 'Failed to create gem fact' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/gem-facts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, fact, gem_type, source, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing gem fact ID' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (fact !== undefined) updateData.fact = fact;
    if (gem_type !== undefined) updateData.gem_type = gem_type;
    if (source !== undefined) updateData.source = source;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('gem_facts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating gem fact:', error);
      return NextResponse.json({ error: 'Failed to update gem fact' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/gem-facts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing gem fact ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('gem_facts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting gem fact:', error);
      return NextResponse.json({ error: 'Failed to delete gem fact' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/gem-facts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}