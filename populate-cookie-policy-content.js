// Script to populate the Cookie Policy page content in the database
// Run this once to populate all existing Cookie Policy page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cookiePolicyContent = [
  { section: 'cookie-policy', key: 'title', content_type: 'text', value: 'Cookie Policy' },
  { section: 'cookie-policy', key: 'last_updated', content_type: 'text', value: 'Last updated: January 2025' },
  { section: 'cookie-policy', key: 'what_are_title', content_type: 'text', value: 'What Are Cookies?' },
  { section: 'cookie-policy', key: 'what_are_content', content_type: 'text', value: 'Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They help us provide you with a better browsing experience and allow certain features to function properly.' },
  { section: 'cookie-policy', key: 'how_use_title', content_type: 'text', value: 'How We Use Cookies' },
  { section: 'cookie-policy', key: 'how_use_intro', content_type: 'text', value: 'Gemsutopia uses cookies for the following purposes:' },
  { section: 'cookie-policy', key: 'how_use_essential', content_type: 'text', value: 'Essential Cookies: Required for basic website functionality, shopping cart, and checkout process' },
  { section: 'cookie-policy', key: 'how_use_performance', content_type: 'text', value: 'Performance Cookies: Help us understand how visitors interact with our website by collecting anonymous information' },
  { section: 'cookie-policy', key: 'how_use_functional', content_type: 'text', value: 'Functional Cookies: Remember your preferences and settings to enhance your experience' },
  { section: 'cookie-policy', key: 'how_use_marketing', content_type: 'text', value: 'Marketing Cookies: Used to deliver relevant advertisements and track campaign effectiveness' },
  { section: 'cookie-policy', key: 'types_title', content_type: 'text', value: 'Types of Cookies We Use' },
  { section: 'cookie-policy', key: 'essential_subtitle', content_type: 'text', value: 'Essential Cookies' },
  { section: 'cookie-policy', key: 'essential_content', content_type: 'text', value: 'These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting privacy preferences, logging in, or filling in forms.' },
  { section: 'cookie-policy', key: 'analytics_subtitle', content_type: 'text', value: 'Analytics Cookies' },
  { section: 'cookie-policy', key: 'analytics_content', content_type: 'text', value: 'We use analytics cookies to understand how visitors use our website. This helps us improve our website performance and user experience. All information collected is anonymous.' },
  { section: 'cookie-policy', key: 'marketing_subtitle', content_type: 'text', value: 'Marketing Cookies' },
  { section: 'cookie-policy', key: 'marketing_content', content_type: 'text', value: 'These cookies track your browsing activity to help us show you relevant advertisements. They may be set by us or third-party advertising partners.' },
  { section: 'cookie-policy', key: 'managing_title', content_type: 'text', value: 'Managing Your Cookie Preferences' },
  { section: 'cookie-policy', key: 'managing_intro', content_type: 'text', value: 'You can control and manage cookies in several ways:' },
  { section: 'cookie-policy', key: 'managing_browser', content_type: 'text', value: 'Browser Settings: Most browsers allow you to control cookies through their settings preferences' },
  { section: 'cookie-policy', key: 'managing_settings', content_type: 'text', value: 'Cookie Settings: Use our Cookie Settings page to manage your preferences' },
  { section: 'cookie-policy', key: 'managing_optout', content_type: 'text', value: 'Opt-Out: You can opt-out of certain cookies, though this may affect website functionality' },
  { section: 'cookie-policy', key: 'managing_note', content_type: 'text', value: 'Please note that disabling certain cookies may impact your browsing experience and prevent some features from working properly.' },
  { section: 'cookie-policy', key: 'third_party_title', content_type: 'text', value: 'Third-Party Cookies' },
  { section: 'cookie-policy', key: 'third_party_intro', content_type: 'text', value: 'Some cookies on our website are set by third-party services we use, such as:' },
  { section: 'cookie-policy', key: 'third_party_analytics', content_type: 'text', value: 'Google Analytics (for website analytics)' },
  { section: 'cookie-policy', key: 'third_party_payment', content_type: 'text', value: 'Payment processors (for secure transactions)' },
  { section: 'cookie-policy', key: 'third_party_social', content_type: 'text', value: 'Social media platforms (for social sharing features)' },
  { section: 'cookie-policy', key: 'third_party_email', content_type: 'text', value: 'Email marketing services (for newsletter functionality)' },
  { section: 'cookie-policy', key: 'retention_title', content_type: 'text', value: 'Cookie Retention' },
  { section: 'cookie-policy', key: 'retention_intro', content_type: 'text', value: 'Cookies remain on your device for different periods depending on their type:' },
  { section: 'cookie-policy', key: 'retention_session', content_type: 'text', value: 'Session Cookies: Deleted when you close your browser' },
  { section: 'cookie-policy', key: 'retention_persistent', content_type: 'text', value: 'Persistent Cookies: Remain for a set period or until you delete them' },
  { section: 'cookie-policy', key: 'retention_essential_time', content_type: 'text', value: 'Essential Cookies: Typically expire after 1 year' },
  { section: 'cookie-policy', key: 'retention_analytics_time', content_type: 'text', value: 'Analytics Cookies: Usually expire after 2 years' },
  { section: 'cookie-policy', key: 'consent_title', content_type: 'text', value: 'Your Consent' },
  { section: 'cookie-policy', key: 'consent_content', content_type: 'text', value: 'By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by adjusting your cookie settings or browser preferences.' },
  { section: 'cookie-policy', key: 'updates_title', content_type: 'text', value: 'Updates to This Policy' },
  { section: 'cookie-policy', key: 'updates_content', content_type: 'text', value: 'We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We encourage you to review this page periodically.' },
  { section: 'cookie-policy', key: 'contact_title', content_type: 'text', value: 'Contact Us' },
  { section: 'cookie-policy', key: 'contact_content', content_type: 'text', value: 'If you have any questions about our use of cookies, please contact us at gemsutopia@gmail.com.' }
];

async function populateCookiePolicyContent() {
  console.log('Populating Cookie Policy page content...');
  
  for (const item of cookiePolicyContent) {
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

populateCookiePolicyContent();