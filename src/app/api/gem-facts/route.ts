import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get a random gem fact
    const { data: gemFacts, error } = await supabase
      .from('gem_facts')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching gem facts:', error);
      return NextResponse.json({ error: 'Failed to fetch gem facts' }, { status: 500 });
    }

    if (!gemFacts || gemFacts.length === 0) {
      return NextResponse.json({ fact: 'Gems have fascinated humans for thousands of years with their beauty and rarity.', gem_type: 'General', source: 'Default' });
    }

    // Return a random fact
    const randomIndex = Math.floor(Math.random() * gemFacts.length);
    const randomFact = gemFacts[randomIndex];

    return NextResponse.json(randomFact);
  } catch (error) {
    console.error('Error in GET /api/gem-facts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}