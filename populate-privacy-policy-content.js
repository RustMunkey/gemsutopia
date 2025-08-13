// Script to populate the Privacy Policy page content in the database
// Run this once to populate all existing Privacy Policy page content

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const privacyPolicyContent = [
  { section: 'privacy-policy', key: 'title', content_type: 'text', value: 'Privacy Policy' },
  { section: 'privacy-policy', key: 'last_updated', content_type: 'text', value: 'Last updated: January 2025' },
  { section: 'privacy-policy', key: 'intro_paragraph_1', content_type: 'text', value: 'This Privacy Policy describes how and when Gemsutopia ("I", "me", "my") collects, uses, and shares information when you purchase an item from Gemsutopia (Gemsutopia.ca) contact me, or otherwise use my services through this site.' },
  { section: 'privacy-policy', key: 'intro_paragraph_2', content_type: 'text', value: 'You agree that by purchasing an item from Gemsutopia or otherwise interacting with Gemsutopia, you have read, understood, and agree to be bound by all of the terms of this Privacy Policy. If you do not agree, you must leave Gemsutopia immediately.' },
  { section: 'privacy-policy', key: 'intro_paragraph_3', content_type: 'text', value: 'I may change this Privacy Policy from time to time. If I make changes, I will notify you by revising the date at the top of the page.' },
  { section: 'privacy-policy', key: 'intro_paragraph_4', content_type: 'text', value: 'This Privacy Policy does not apply to the practices of third parties that I do not own or control through Gemsutopia such as Gemrockauctions or Etsy.' },
  { section: 'privacy-policy', key: 'intro_paragraph_5', content_type: 'text', value: 'Additionally, I will make every reasonable effort to inform you when I interact with third parties with your information; however, you are solely responsible for reviewing, understanding, and agreeing to or not agreeing to any third-party privacy policies.' },
  { section: 'privacy-policy', key: 'information_collect_title', content_type: 'text', value: 'Information I Collect' },
  { section: 'privacy-policy', key: 'information_collect_content', content_type: 'text', value: 'To fulfill your order, you must provide me with certain information such as your name, e-mail address, postal address, payment information, and the details of the product that you\'re ordering. You may also choose to provide me with additional personal information from time to time if you contact me directly.' },
  { section: 'privacy-policy', key: 'why_use_title', content_type: 'text', value: 'Why I Need Your Information and How I Use It' },
  { section: 'privacy-policy', key: 'why_use_intro', content_type: 'text', value: 'I collect, use and share your information in several legally-permissible ways, including:' },
  { section: 'privacy-policy', key: 'why_use_item_1', content_type: 'text', value: 'As needed to provide my services, such as when I use your information to fulfill your order, to settle disputes, or to provide you with customer support;' },
  { section: 'privacy-policy', key: 'why_use_item_2', content_type: 'text', value: 'When you have provided your affirmative consent, which you may revoke at any time, such as by signing up for my mailing list or to receive notifications from me;' },
  { section: 'privacy-policy', key: 'why_use_item_3', content_type: 'text', value: 'If necessary to comply with a court order or legal obligation, such as retaining information about your purchases if required by tax law; and' },
  { section: 'privacy-policy', key: 'why_use_item_4', content_type: 'text', value: 'As necessary for my own legitimate interests, if those legitimate interests are not overridden by your rights or interests, such as (a) providing and enhancing my services;' },
  { section: 'privacy-policy', key: 'sharing_title', content_type: 'text', value: 'Information Sharing and Disclosure' },
  { section: 'privacy-policy', key: 'sharing_intro', content_type: 'text', value: 'Protecting my customers\' personal information is crucially important to my business and something I take very seriously. For these reasons, I share your personal information only for very limited reasons and in limited circumstances, as follows:' },
  { section: 'privacy-policy', key: 'sharing_third_party_title', content_type: 'text', value: 'With Third-Party Service Providers.' },
  { section: 'privacy-policy', key: 'sharing_third_party_content', content_type: 'text', value: 'I engage the following trusted third parties to perform functions and provider services to my shop:\n\nI share you personal information with these third parties, but only to the extent necessary to perform these services;' },
  { section: 'privacy-policy', key: 'sharing_business_title', content_type: 'text', value: 'In the Event of a Business Transfer.' },
  { section: 'privacy-policy', key: 'sharing_business_content', content_type: 'text', value: 'If I sell or merge my business, I may disclose your information as part of that transaction, only to the extent permitted by law.' },
  { section: 'privacy-policy', key: 'sharing_legal_title', content_type: 'text', value: 'In Compliance with Laws.' },
  { section: 'privacy-policy', key: 'sharing_legal_content', content_type: 'text', value: 'I may collect, use, retain, and share your information if I have a good faith belief that doing so is reasonably necessary to: (a) respond to legal process or to government requests; (b) perform legal obligations to which I am bound by agreements; (c) prevent, investigate, and address fraud and other illegal activity, security, or technical issues; or (d) protect the rights, property, and safety of my customers, or others.' },
  { section: 'privacy-policy', key: 'retention_title', content_type: 'text', value: 'How Long I Store Your Information' },
  { section: 'privacy-policy', key: 'retention_content', content_type: 'text', value: 'I retain your personal information only for as long as necessary to provide you with my services and as otherwise described in my Privacy Policy. However, I may also be required to retain this information to comply with my legal and regulatory obligations, to resolve disputes, and to enforce or perform under my agreements. I generally keep your data for the following time period: five (5) years.' },
  { section: 'privacy-policy', key: 'transfers_title', content_type: 'text', value: 'Transfers of Personal Information Outside the EU' },
  { section: 'privacy-policy', key: 'transfers_content', content_type: 'text', value: 'I may store and process your information through third-party hosting services in the US and other jurisdictions. As a result, I may transfer your personal information to a jurisdiction with different data protection and government surveillance laws than your jurisdiction has. If I am required to transfer information about you outside of the EU, I rely on Privacy Shield as the legal basis for the transfer, as Google Cloud is Privacy Shield certified.' },
  { section: 'privacy-policy', key: 'rights_title', content_type: 'text', value: 'Your Rights' },
  { section: 'privacy-policy', key: 'rights_intro', content_type: 'text', value: 'If you reside in certain territories, including the EU, you have a number of rights in relation to your personal information. While some of these rights apply generally, certain rights apply only in certain limited cases. Your rights are as follows:' },
  { section: 'privacy-policy', key: 'rights_access_title', content_type: 'text', value: 'Right to Access.' },
  { section: 'privacy-policy', key: 'rights_access_content', content_type: 'text', value: 'You may have the right to access and receive a copy of the personal information I hold about you by contacting me using the contact information below.' },
  { section: 'privacy-policy', key: 'rights_change_title', content_type: 'text', value: 'Right to Change, Restrict, or Delete.' },
  { section: 'privacy-policy', key: 'rights_change_content', content_type: 'text', value: 'You may also have rights to change, restrict my use of, or delete your personal information. Absent exceptional circumstances (such as where I am required to store information for legal reasons) I will generally delete your personal information upon your request.' },
  { section: 'privacy-policy', key: 'rights_object_title', content_type: 'text', value: 'Right to Object.' },
  { section: 'privacy-policy', key: 'rights_object_content', content_type: 'text', value: 'You can object to (a) my processing of some of your information based on my legitimate interests and (b) receiving marketing messages from me. In such cases, I will delete your personal information unless I have compelling and legitimate grounds to continue storing and using your information or if it is needed for legal reasons.' },
  { section: 'privacy-policy', key: 'rights_complain_title', content_type: 'text', value: 'Right to Complain.' },
  { section: 'privacy-policy', key: 'rights_complain_content', content_type: 'text', value: 'If you reside in the EU and wish to raise a concern about my use of your information (and without prejudice to any other rights you may have), you have the right to do so with your local data protection authority.' },
  { section: 'privacy-policy', key: 'contact_title', content_type: 'text', value: 'How to Contact Me' },
  { section: 'privacy-policy', key: 'contact_content', content_type: 'text', value: 'You may reach me with any concerns relating to privacy at Gemsutopia@gmail.com' }
];

async function populatePrivacyPolicyContent() {
  console.log('Populating Privacy Policy page content...');
  
  for (const item of privacyPolicyContent) {
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

populatePrivacyPolicyContent();