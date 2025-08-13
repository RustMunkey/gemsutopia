// Script to populate the Terms of Service page content in the database
// Run this once to populate all existing Terms of Service page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const termsOfServiceContent = [
  { section: 'terms-of-service', key: 'title', content_type: 'text', value: 'Terms of Service' },
  { section: 'terms-of-service', key: 'last_updated', content_type: 'text', value: 'Last updated: January 2025' },
  { section: 'terms-of-service', key: 'acceptance_title', content_type: 'text', value: '1. Acceptance of Terms' },
  { section: 'terms-of-service', key: 'acceptance_content', content_type: 'text', value: 'By accessing and using Gemsutopia\'s website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.' },
  { section: 'terms-of-service', key: 'products_title', content_type: 'text', value: '2. Products and Services' },
  { section: 'terms-of-service', key: 'products_paragraph_1', content_type: 'text', value: 'Gemsutopia offers premium gemstones and jewelry pieces, many of which are hand-mined and ethically sourced from Alberta, Canada. All product descriptions, images, and specifications are provided to the best of our knowledge and ability.' },
  { section: 'terms-of-service', key: 'products_paragraph_2', content_type: 'text', value: 'We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.' },
  { section: 'terms-of-service', key: 'orders_title', content_type: 'text', value: '3. Orders and Payment' },
  { section: 'terms-of-service', key: 'orders_paragraph_1', content_type: 'text', value: 'By placing an order through our website, you are making an offer to purchase products subject to these terms. All orders are subject to availability and confirmation.' },
  { section: 'terms-of-service', key: 'orders_paragraph_2', content_type: 'text', value: 'Payment is required at the time of purchase. We accept major credit cards, PayPal, and other payment methods as displayed on our website. All prices are in Canadian dollars unless otherwise stated.' },
  { section: 'terms-of-service', key: 'shipping_title', content_type: 'text', value: '4. Shipping and Delivery' },
  { section: 'terms-of-service', key: 'shipping_paragraph_1', content_type: 'text', value: 'Shipping times are estimates and may vary. We are not responsible for delays caused by shipping carriers, customs, or other factors beyond our control.' },
  { section: 'terms-of-service', key: 'shipping_paragraph_2', content_type: 'text', value: 'Risk of loss and title for items purchased from Gemsutopia pass to you upon delivery to the shipping carrier.' },
  { section: 'terms-of-service', key: 'returns_title', content_type: 'text', value: '5. Returns and Refunds' },
  { section: 'terms-of-service', key: 'returns_content', content_type: 'text', value: 'Please refer to our Returns & Exchange policy for detailed information about returns, exchanges, and refunds. All returns must be authorized and comply with our return policy.' },
  { section: 'terms-of-service', key: 'intellectual_title', content_type: 'text', value: '6. Intellectual Property' },
  { section: 'terms-of-service', key: 'intellectual_content', content_type: 'text', value: 'All content on this website, including text, graphics, logos, images, and software, is the property of Gemsutopia and is protected by copyright and other intellectual property laws.' },
  { section: 'terms-of-service', key: 'liability_title', content_type: 'text', value: '7. Limitation of Liability' },
  { section: 'terms-of-service', key: 'liability_content', content_type: 'text', value: 'Gemsutopia shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.' },
  { section: 'terms-of-service', key: 'privacy_title', content_type: 'text', value: '8. Privacy' },
  { section: 'terms-of-service', key: 'privacy_content', content_type: 'text', value: 'Your privacy is important to us. Please refer to our Privacy Policy for information about how we collect, use, and protect your personal information.' },
  { section: 'terms-of-service', key: 'contact_title', content_type: 'text', value: '9. Contact Information' },
  { section: 'terms-of-service', key: 'contact_content', content_type: 'text', value: 'If you have any questions about these Terms of Service, please contact us at gemsutopia@gmail.com.' },
  { section: 'terms-of-service', key: 'changes_title', content_type: 'text', value: '10. Changes to Terms' },
  { section: 'terms-of-service', key: 'changes_content', content_type: 'text', value: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the service constitutes acceptance of the modified terms.' }
];

async function populateTermsOfServiceContent() {
  console.log('Populating Terms of Service page content...');
  
  for (const item of termsOfServiceContent) {
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

populateTermsOfServiceContent();