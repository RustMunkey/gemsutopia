// Script to populate the Support page content in the database
// Run this once to populate all existing Support page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supportContent = [
  {
    section: 'support',
    key: 'title',
    content_type: 'text',
    value: 'Support Center'
  },
  {
    section: 'support',
    key: 'subtitle',
    content_type: 'text',
    value: "We're here to help you with any questions"
  },
  {
    section: 'support',
    key: 'email_support_title',
    content_type: 'text',
    value: 'Email Support'
  },
  {
    section: 'support',
    key: 'email_support_description',
    content_type: 'text',
    value: 'Get help via email'
  },
  {
    section: 'support',
    key: 'email_address',
    content_type: 'text',
    value: 'gemsutopia@gmail.com'
  },
  {
    section: 'support',
    key: 'response_time_title',
    content_type: 'text',
    value: 'Response Time'
  },
  {
    section: 'support',
    key: 'response_time_description',
    content_type: 'text',
    value: 'We typically respond within'
  },
  {
    section: 'support',
    key: 'response_time_value',
    content_type: 'text',
    value: '24 hours'
  },
  {
    section: 'support',
    key: 'faq_title',
    content_type: 'text',
    value: 'FAQ'
  },
  {
    section: 'support',
    key: 'faq_description',
    content_type: 'text',
    value: 'Your questions answered'
  },
  {
    section: 'support',
    key: 'faq_section_title',
    content_type: 'text',
    value: 'Frequently Asked Questions'
  },
  {
    section: 'support',
    key: 'faq_1_question',
    content_type: 'text',
    value: 'How do I track my order?'
  },
  {
    section: 'support',
    key: 'faq_1_answer',
    content_type: 'text',
    value: "Once your order is shipped, you'll receive a tracking number via email. You can use this number to track your package on our shipping partner's website."
  },
  {
    section: 'support',
    key: 'faq_2_question',
    content_type: 'text',
    value: 'What is your return policy?'
  },
  {
    section: 'support',
    key: 'faq_2_answer',
    content_type: 'text',
    value: 'We offer a 30-day return policy for all items in original condition. Please see our Returns & Exchange page for detailed information.'
  },
  {
    section: 'support',
    key: 'faq_3_question',
    content_type: 'text',
    value: 'Are your gemstones authentic?'
  },
  {
    section: 'support',
    key: 'faq_3_answer',
    content_type: 'text',
    value: 'Yes, all our gemstones come with certificates of authenticity and are sourced from trusted suppliers worldwide.'
  },
  {
    section: 'support',
    key: 'faq_4_question',
    content_type: 'text',
    value: 'How long does shipping take?'
  },
  {
    section: 'support',
    key: 'faq_4_answer',
    content_type: 'text',
    value: 'Standard shipping takes 3-5 business days. Express shipping options are available at checkout for faster delivery.'
  }
];

async function populateSupportContent() {
  console.log('Populating Support page content...');
  
  for (const item of supportContent) {
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

populateSupportContent();