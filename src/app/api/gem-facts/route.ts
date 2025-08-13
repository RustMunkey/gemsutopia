import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get all active gem facts
    const { data: gemFacts, error } = await supabase
      .from('gem_facts')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching gem facts:', error);
      return NextResponse.json({ error: 'Failed to fetch gem facts' }, { status: 500 });
    }

    if (!gemFacts || gemFacts.length === 0) {
      return NextResponse.json({ 
        id: 'fallback',
        fact: 'Gems have fascinated humans for thousands of years with their beauty and rarity.', 
        gem_type: 'General', 
        source: 'Default',
        is_active: true
      });
    }

    // Use current date to deterministically select fact of the day
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const factIndex = dayOfYear % gemFacts.length;
    const factOfTheDay = gemFacts[factIndex];

    return NextResponse.json(factOfTheDay);
  } catch (error) {
    console.error('Error in GET /api/gem-facts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}