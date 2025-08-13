// Script to populate the Cookie Settings page content in the database
// Run this once to populate all existing Cookie Settings page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cookieSettingsContent = [
  { section: 'cookie-settings', key: 'title', content_type: 'text', value: 'Cookie Settings' },
  { section: 'cookie-settings', key: 'subtitle', content_type: 'text', value: 'Manage your cookie preferences' },
  { section: 'cookie-settings', key: 'saved_message', content_type: 'text', value: '✅ Cookie preferences saved successfully!' },
  { section: 'cookie-settings', key: 'intro_text', content_type: 'text', value: 'We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. You can customize your cookie preferences below. Please note that disabling certain cookies may impact your experience on our website.' },
  { section: 'cookie-settings', key: 'essential_title', content_type: 'text', value: 'Essential Cookies' },
  { section: 'cookie-settings', key: 'essential_description', content_type: 'text', value: 'These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.' },
  { section: 'cookie-settings', key: 'essential_status', content_type: 'text', value: 'Always Active' },
  { section: 'cookie-settings', key: 'analytics_title', content_type: 'text', value: 'Analytics Cookies' },
  { section: 'cookie-settings', key: 'analytics_description', content_type: 'text', value: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website performance and user experience.' },
  { section: 'cookie-settings', key: 'marketing_title', content_type: 'text', value: 'Marketing Cookies' },
  { section: 'cookie-settings', key: 'marketing_description', content_type: 'text', value: 'These cookies track your browsing activity to help us show you relevant advertisements and measure the effectiveness of our marketing campaigns. They may be set by us or third-party advertising partners.' },
  { section: 'cookie-settings', key: 'functional_title', content_type: 'text', value: 'Functional Cookies' },
  { section: 'cookie-settings', key: 'functional_description', content_type: 'text', value: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. They may be set by us or by third-party providers whose services we use on our pages.' },
  { section: 'cookie-settings', key: 'save_button', content_type: 'text', value: 'Save Preferences' },
  { section: 'cookie-settings', key: 'accept_all_button', content_type: 'text', value: 'Accept All' },
  { section: 'cookie-settings', key: 'reject_all_button', content_type: 'text', value: 'Reject All (except Essential)' },
  { section: 'cookie-settings', key: 'footer_text', content_type: 'text', value: 'Need more information? Visit our' },
  { section: 'cookie-settings', key: 'footer_link_text', content_type: 'text', value: 'Cookie Policy' },
  { section: 'cookie-settings', key: 'footer_text_end', content_type: 'text', value: 'for detailed information about how we use cookies.' }
];

async function populateCookieSettingsContent() {
  console.log('Populating Cookie Settings page content...');
  
  for (const item of cookieSettingsContent) {
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

populateCookieSettingsContent();