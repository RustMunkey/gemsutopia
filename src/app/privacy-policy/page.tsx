'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/privacy-policy')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Privacy Policy",
    last_updated: "Last updated: January 2025",
    intro_paragraph_1: "This Privacy Policy describes how and when Gemsutopia (\"I\", \"me\", \"my\") collects, uses, and shares information when you purchase an item from Gemsutopia (Gemsutopia.ca) contact me, or otherwise use my services through this site.",
    intro_paragraph_2: "You agree that by purchasing an item from Gemsutopia or otherwise interacting with Gemsutopia, you have read, understood, and agree to be bound by all of the terms of this Privacy Policy. If you do not agree, you must leave Gemsutopia immediately.",
    intro_paragraph_3: "I may change this Privacy Policy from time to time. If I make changes, I will notify you by revising the date at the top of the page.",
    intro_paragraph_4: "This Privacy Policy does not apply to the practices of third parties that I do not own or control through Gemsutopia such as Gemrockauctions or Etsy.",
    intro_paragraph_5: "Additionally, I will make every reasonable effort to inform you when I interact with third parties with your information; however, you are solely responsible for reviewing, understanding, and agreeing to or not agreeing to any third-party privacy policies.",
    information_collect_title: "Information I Collect",
    information_collect_content: "To fulfill your order, you must provide me with certain information such as your name, e-mail address, postal address, payment information, and the details of the product that you're ordering. You may also choose to provide me with additional personal information from time to time if you contact me directly.",
    why_use_title: "Why I Need Your Information and How I Use It",
    why_use_intro: "I collect, use and share your information in several legally-permissible ways, including:",
    why_use_item_1: "As needed to provide my services, such as when I use your information to fulfill your order, to settle disputes, or to provide you with customer support;",
    why_use_item_2: "When you have provided your affirmative consent, which you may revoke at any time, such as by signing up for my mailing list or to receive notifications from me;",
    why_use_item_3: "If necessary to comply with a court order or legal obligation, such as retaining information about your purchases if required by tax law; and",
    why_use_item_4: "As necessary for my own legitimate interests, if those legitimate interests are not overridden by your rights or interests, such as (a) providing and enhancing my services;",
    sharing_title: "Information Sharing and Disclosure",
    sharing_intro: "Protecting my customers' personal information is crucially important to my business and something I take very seriously. For these reasons, I share your personal information only for very limited reasons and in limited circumstances, as follows:",
    sharing_third_party_title: "With Third-Party Service Providers.",
    sharing_third_party_content: "I engage the following trusted third parties to perform functions and provider services to my shop:\n\nI share you personal information with these third parties, but only to the extent necessary to perform these services;",
    sharing_business_title: "In the Event of a Business Transfer.",
    sharing_business_content: "If I sell or merge my business, I may disclose your information as part of that transaction, only to the extent permitted by law.",
    sharing_legal_title: "In Compliance with Laws.",
    sharing_legal_content: "I may collect, use, retain, and share your information if I have a good faith belief that doing so is reasonably necessary to: (a) respond to legal process or to government requests; (b) perform legal obligations to which I am bound by agreements; (c) prevent, investigate, and address fraud and other illegal activity, security, or technical issues; or (d) protect the rights, property, and safety of my customers, or others.",
    retention_title: "How Long I Store Your Information",
    retention_content: "I retain your personal information only for as long as necessary to provide you with my services and as otherwise described in my Privacy Policy. However, I may also be required to retain this information to comply with my legal and regulatory obligations, to resolve disputes, and to enforce or perform under my agreements. I generally keep your data for the following time period: five (5) years.",
    transfers_title: "Transfers of Personal Information Outside the EU",
    transfers_content: "I may store and process your information through third-party hosting services in the US and other jurisdictions. As a result, I may transfer your personal information to a jurisdiction with different data protection and government surveillance laws than your jurisdiction has. If I am required to transfer information about you outside of the EU, I rely on Privacy Shield as the legal basis for the transfer, as Google Cloud is Privacy Shield certified.",
    rights_title: "Your Rights",
    rights_intro: "If you reside in certain territories, including the EU, you have a number of rights in relation to your personal information. While some of these rights apply generally, certain rights apply only in certain limited cases. Your rights are as follows:",
    rights_access_title: "Right to Access.",
    rights_access_content: "You may have the right to access and receive a copy of the personal information I hold about you by contacting me using the contact information below.",
    rights_change_title: "Right to Change, Restrict, or Delete.",
    rights_change_content: "You may also have rights to change, restrict my use of, or delete your personal information. Absent exceptional circumstances (such as where I am required to store information for legal reasons) I will generally delete your personal information upon your request.",
    rights_object_title: "Right to Object.",
    rights_object_content: "You can object to (a) my processing of some of your information based on my legitimate interests and (b) receiving marketing messages from me. In such cases, I will delete your personal information unless I have compelling and legitimate grounds to continue storing and using your information or if it is needed for legal reasons.",
    rights_complain_title: "Right to Complain.",
    rights_complain_content: "If you reside in the EU and wish to raise a concern about my use of your information (and without prejudice to any other rights you may have), you have the right to do so with your local data protection authority.",
    contact_title: "How to Contact Me",
    contact_content: "You may reach me with any concerns relating to privacy at Gemsutopia@gmail.com"
  };

  // Use CMS content if available, otherwise fall back to defaults
  const getContent = (key: string): string => content[key] || defaultContent[key] || '';
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <Header />
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">{getContent('title')}</h1>
              <p className="text-lg text-neutral-600">{getContent('last_updated')}</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
              <p className="text-lg mb-6">
                {getContent('intro_paragraph_1')}
              </p>
              
              <p className="mb-6">
                {getContent('intro_paragraph_2')}
              </p>
              
              <p className="mb-6">
                {getContent('intro_paragraph_3')}
              </p>
              
              <p className="mb-6">
                {getContent('intro_paragraph_4')}
              </p>
              
              <p className="mb-8">
                {getContent('intro_paragraph_5')}
              </p>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('information_collect_title')}</h2>
              <p>
                {getContent('information_collect_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('why_use_title')}</h2>
              <p className="mb-4">{getContent('why_use_intro')}</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('why_use_item_1')}</li>
                <li>{getContent('why_use_item_2')}</li>
                <li>{getContent('why_use_item_3')}</li>
                <li>{getContent('why_use_item_4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('sharing_title')}</h2>
              <p className="mb-4">
                {getContent('sharing_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-4">
                <li>
                  <strong>{getContent('sharing_third_party_title')}</strong> {getContent('sharing_third_party_content')}
                </li>
                <li>
                  <strong>{getContent('sharing_business_title')}</strong> {getContent('sharing_business_content')}
                </li>
                <li>
                  <strong>{getContent('sharing_legal_title')}</strong> {getContent('sharing_legal_content')}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('retention_title')}</h2>
              <p>
                {getContent('retention_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('transfers_title')}</h2>
              <p>
                {getContent('transfers_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('rights_title')}</h2>
              <p className="mb-4">{getContent('rights_intro')}</p>
              <ul className="list-disc ml-6 space-y-3">
                <li>
                  <strong>{getContent('rights_access_title')}</strong> {getContent('rights_access_content')}
                </li>
                <li>
                  <strong>{getContent('rights_change_title')}</strong> {getContent('rights_change_content')}
                </li>
                <li>
                  <strong>{getContent('rights_object_title')}</strong> {getContent('rights_object_content')}
                </li>
                <li>
                  <strong>{getContent('rights_complain_title')}</strong> {getContent('rights_complain_content')}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('contact_title')}</h2>
              <p>
                {getContent('contact_content')}
              </p>
            </section>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}