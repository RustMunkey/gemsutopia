// Script to populate the Returns & Exchange page content in the database
// Run this once to populate all existing Returns & Exchange page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const returnsExchangeContent = [
  { section: 'returns-exchange', key: 'title', content_type: 'text', value: 'Returns & Exchange' },
  { section: 'returns-exchange', key: 'subtitle', content_type: 'text', value: 'We want you to love your gemstones' },
  { section: 'returns-exchange', key: 'policy_title', content_type: 'text', value: 'Our Return Policy' },
  { section: 'returns-exchange', key: 'policy_intro', content_type: 'text', value: "At Gemsutopia, we want you to be completely satisfied with your purchase. If for any reason you're not happy with your gemstones, we offer a hassle-free return policy." },
  { section: 'returns-exchange', key: 'policy_window', content_type: 'text', value: 'Return Window: You have 30 days from the date of delivery to return your items for a full refund or exchange.' },
  { section: 'returns-exchange', key: 'acceptable_title', content_type: 'text', value: 'What Can Be Returned' },
  { section: 'returns-exchange', key: 'acceptable_intro', content_type: 'text', value: 'We accept returns for:' },
  { section: 'returns-exchange', key: 'acceptable_item_1', content_type: 'text', value: 'Gemstones in their original condition' },
  { section: 'returns-exchange', key: 'acceptable_item_2', content_type: 'text', value: "Jewelry pieces that haven't been resized or altered" },
  { section: 'returns-exchange', key: 'acceptable_item_3', content_type: 'text', value: 'Items that are unworn and undamaged' },
  { section: 'returns-exchange', key: 'acceptable_item_4', content_type: 'text', value: 'Products in their original packaging with all certificates' },
  { section: 'returns-exchange', key: 'unacceptable_title', content_type: 'text', value: 'Items We Cannot Accept' },
  { section: 'returns-exchange', key: 'unacceptable_intro', content_type: 'text', value: 'For hygiene and safety reasons, we cannot accept returns for:' },
  { section: 'returns-exchange', key: 'unacceptable_item_1', content_type: 'text', value: 'Custom or personalized jewelry pieces' },
  { section: 'returns-exchange', key: 'unacceptable_item_2', content_type: 'text', value: 'Items that have been resized or altered' },
  { section: 'returns-exchange', key: 'unacceptable_item_3', content_type: 'text', value: 'Gemstones that show signs of damage or wear' },
  { section: 'returns-exchange', key: 'unacceptable_item_4', content_type: 'text', value: 'Items without original packaging or certificates' },
  { section: 'returns-exchange', key: 'return_steps_title', content_type: 'text', value: 'How to Start a Return' },
  { section: 'returns-exchange', key: 'return_steps_intro', content_type: 'text', value: 'To initiate a return, please follow these simple steps:' },
  { section: 'returns-exchange', key: 'return_step_1', content_type: 'text', value: 'Contact us at gemsutopia@gmail.com with your order number' },
  { section: 'returns-exchange', key: 'return_step_2', content_type: 'text', value: 'Include photos of the item(s) you wish to return' },
  { section: 'returns-exchange', key: 'return_step_3', content_type: 'text', value: 'Specify the reason for return (exchange, refund, damaged, etc.)' },
  { section: 'returns-exchange', key: 'return_step_4', content_type: 'text', value: "We'll provide you with return instructions and a return authorization number" },
  { section: 'returns-exchange', key: 'return_step_5', content_type: 'text', value: 'Package the items securely with all original materials' },
  { section: 'returns-exchange', key: 'return_step_6', content_type: 'text', value: 'Ship using a trackable method (we recommend insurance for valuable items)' },
  { section: 'returns-exchange', key: 'exchange_title', content_type: 'text', value: 'Exchange Process' },
  { section: 'returns-exchange', key: 'exchange_intro', content_type: 'text', value: "If you'd like to exchange your item for a different size, style, or gemstone:" },
  { section: 'returns-exchange', key: 'exchange_item_1', content_type: 'text', value: 'Follow the return process above and specify "exchange" as your reason' },
  { section: 'returns-exchange', key: 'exchange_item_2', content_type: 'text', value: "Let us know what you'd like to exchange it for" },
  { section: 'returns-exchange', key: 'exchange_item_3', content_type: 'text', value: "We'll confirm availability and any price differences" },
  { section: 'returns-exchange', key: 'exchange_item_4', content_type: 'text', value: "Upon receiving your return, we'll ship your new item" },
  { section: 'returns-exchange', key: 'exchange_item_5', content_type: 'text', value: "If there's a price difference, we'll refund or charge accordingly" },
  { section: 'returns-exchange', key: 'refund_title', content_type: 'text', value: 'Refund Processing' },
  { section: 'returns-exchange', key: 'refund_intro', content_type: 'text', value: 'Once we receive and inspect your returned item:' },
  { section: 'returns-exchange', key: 'refund_item_1', content_type: 'text', value: "We'll send you an email confirming receipt" },
  { section: 'returns-exchange', key: 'refund_item_2', content_type: 'text', value: 'Refunds are processed within 3-5 business days' },
  { section: 'returns-exchange', key: 'refund_item_3', content_type: 'text', value: 'Refunds are issued to your original payment method' },
  { section: 'returns-exchange', key: 'refund_item_4', content_type: 'text', value: "You'll receive an email confirmation when the refund is processed" },
  { section: 'returns-exchange', key: 'refund_item_5', content_type: 'text', value: 'Please allow 5-10 business days for the refund to appear in your account' },
  { section: 'returns-exchange', key: 'shipping_title', content_type: 'text', value: 'Shipping Costs' },
  { section: 'returns-exchange', key: 'shipping_returns', content_type: 'text', value: 'Returns: Customers are responsible for return shipping costs unless the item was damaged or incorrectly sent.' },
  { section: 'returns-exchange', key: 'shipping_exchanges', content_type: 'text', value: "Exchanges: We'll cover the cost of shipping your new item to you. You cover the return shipping cost." },
  { section: 'returns-exchange', key: 'shipping_damaged', content_type: 'text', value: "Damaged Items: If you received a damaged item, we'll provide a prepaid return label and cover all shipping costs." },
  { section: 'returns-exchange', key: 'damaged_title', content_type: 'text', value: 'Damaged or Incorrect Items' },
  { section: 'returns-exchange', key: 'damaged_intro', content_type: 'text', value: "If you received a damaged or incorrect item, please contact us immediately at gemsutopia@gmail.com. We'll make it right with:" },
  { section: 'returns-exchange', key: 'damaged_item_1', content_type: 'text', value: 'A full refund including original shipping costs' },
  { section: 'returns-exchange', key: 'damaged_item_2', content_type: 'text', value: 'A replacement item at no additional cost' },
  { section: 'returns-exchange', key: 'damaged_item_3', content_type: 'text', value: 'Prepaid return shipping labels' },
  { section: 'returns-exchange', key: 'damaged_item_4', content_type: 'text', value: 'Expedited processing of your replacement or refund' },
  { section: 'returns-exchange', key: 'questions_title', content_type: 'text', value: 'Questions?' },
  { section: 'returns-exchange', key: 'questions_intro', content_type: 'text', value: "Our team is here to help make your return or exchange as smooth as possible. If you have any questions about our return policy, please don't hesitate to contact us at gemsutopia@gmail.com." },
  { section: 'returns-exchange', key: 'questions_response_time', content_type: 'text', value: 'Response Time: We typically respond to all emails within 24 hours.' }
];

async function populateReturnsExchangeContent() {
  console.log('Populating Returns & Exchange page content...');
  
  for (const item of returnsExchangeContent) {
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

populateReturnsExchangeContent();