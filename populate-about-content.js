// Script to populate the About page content in the database
// Run this once to populate all existing About page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const aboutContent = [
  {
    section: 'about',
    key: 'title',
    content_type: 'text',
    value: 'About Gemsutopia'
  },
  {
    section: 'about',
    key: 'intro_paragraph',
    content_type: 'text',
    value: "First of all, thanks for stopping by — I'm Reese, founder of Gemsutopia and a proud Canadian gem dealer based in Alberta."
  },
  {
    section: 'about',
    key: 'paragraph_1',
    content_type: 'text',
    value: "At Gemsutopia, we believe in gemstones with integrity. Every mineral and specimen you see in my shop is hand-selected, ethically sourced, and personally inspected by me. Many pieces — like our Blue Jay sapphires, Alberta peridot, and Canadian ammolite — were even mined by yours truly, straight from the earth with care and respect."
  },
  {
    section: 'about',
    key: 'paragraph_2',
    content_type: 'text',
    value: "This isn't just a business — it's a passion. I don't list anything I wouldn't be proud to have in my own collection."
  },
  {
    section: 'about',
    key: 'paragraph_3',
    content_type: 'text',
    value: "Each order is thoughtfully packed by my amazing spouse (she's the best), and we often include a small bonus gift as a thank-you for supporting our dream."
  },
  {
    section: 'about',
    key: 'paragraph_4',
    content_type: 'text',
    value: "You can shop with confidence knowing we stand behind every piece, from quality to safe delivery."
  },
  {
    section: 'about',
    key: 'shipping_title',
    content_type: 'text',
    value: 'Shipping & Processing'
  },
  {
    section: 'about',
    key: 'shipping_item_1',
    content_type: 'text',
    value: 'Processing time: 1–2 business days'
  },
  {
    section: 'about',
    key: 'shipping_item_2',
    content_type: 'text',
    value: 'Estimated delivery (Canada): 3–15 business days (not guaranteed)'
  },
  {
    section: 'about',
    key: 'shipping_item_3',
    content_type: 'text',
    value: 'Estimated delivery (USA): 5–20 business days (not guaranteed)'
  },
  {
    section: 'about',
    key: 'shipping_note',
    content_type: 'text',
    value: "Have a question or issue? Reach out anytime! I'll always do my best to help."
  },
  {
    section: 'about',
    key: 'closing_paragraph',
    content_type: 'text',
    value: "Thanks so much for supporting Gemsutopia. You're not just buying a gem.. you're also investing in a story, a journey, and a small Canadian business that truly cares."
  },
  {
    section: 'about',
    key: 'signature',
    content_type: 'text',
    value: '— Reese @ Gemsutopia'
  }
];

async function populateAboutContent() {
  console.log('Populating About page content...');
  
  for (const item of aboutContent) {
    const { data, error } = await supabase
      .from('site_content')
      .upsert(item, { onConflict: 'section,key' });
    
    if (error) {
      console.error(`Error inserting ${item.key}:`, error);
    } else {
      console.log(`✓ Inserted ${item.key}`);
    }
  }
  
  console.log('Done!');
}

populateAboutContent();