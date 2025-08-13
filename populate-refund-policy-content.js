// Script to populate the Refund Policy page content in the database
// Run this once to populate all existing Refund Policy page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const refundPolicyContent = [
  {
    section: 'refund-policy',
    key: 'title',
    content_type: 'text',
    value: 'Refund Policy'
  },
  {
    section: 'refund-policy',
    key: 'subtitle',
    content_type: 'text',
    value: 'Your satisfaction is our priority'
  },
  {
    section: 'refund-policy',
    key: 'guarantee_title',
    content_type: 'text',
    value: '30-Day Money Back Guarantee'
  },
  {
    section: 'refund-policy',
    key: 'guarantee_content',
    content_type: 'text',
    value: "We stand behind the quality of our products. If you're not completely satisfied with your purchase, you may return it within 30 days of delivery for a full refund."
  },
  {
    section: 'refund-policy',
    key: 'process_title',
    content_type: 'text',
    value: 'Refund Process'
  },
  {
    section: 'refund-policy',
    key: 'process_item_1',
    content_type: 'text',
    value: 'Contact our customer service team to initiate a return'
  },
  {
    section: 'refund-policy',
    key: 'process_item_2',
    content_type: 'text',
    value: 'Return items must be in original condition with all packaging'
  },
  {
    section: 'refund-policy',
    key: 'process_item_3',
    content_type: 'text',
    value: 'Refunds are processed within 5-7 business days after we receive your return'
  },
  {
    section: 'refund-policy',
    key: 'process_item_4',
    content_type: 'text',
    value: 'Original shipping costs are non-refundable'
  },
  {
    section: 'refund-policy',
    key: 'exceptions_title',
    content_type: 'text',
    value: 'Exceptions'
  },
  {
    section: 'refund-policy',
    key: 'exceptions_content',
    content_type: 'text',
    value: 'Custom or personalized items cannot be returned unless defective. Sale items are final sale and cannot be returned for refund, but may be exchanged for store credit.'
  },
  {
    section: 'refund-policy',
    key: 'damaged_title',
    content_type: 'text',
    value: 'Damaged or Defective Items'
  },
  {
    section: 'refund-policy',
    key: 'damaged_content',
    content_type: 'text',
    value: 'If you receive a damaged or defective item, please contact us immediately. We will provide a prepaid return label and process your refund or replacement as soon as possible.'
  },
  {
    section: 'refund-policy',
    key: 'contact_title',
    content_type: 'text',
    value: 'Contact Us'
  },
  {
    section: 'refund-policy',
    key: 'contact_content',
    content_type: 'text',
    value: 'For questions about our refund policy or to initiate a return, please contact us at support@gemsutopia.com or call +1 (555) 123-4567.'
  }
];

async function populateRefundPolicyContent() {
  console.log('Populating Refund Policy page content...');
  
  for (const item of refundPolicyContent) {
    const { error } = await supabase
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

populateRefundPolicyContent();