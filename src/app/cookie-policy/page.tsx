'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CookiePolicy() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages/cookie-policy')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Cookie Policy",
    last_updated: "Last updated: January 2025",
    what_are_title: "What Are Cookies?",
    what_are_content: "Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They help us provide you with a better browsing experience and allow certain features to function properly.",
    how_use_title: "How We Use Cookies",
    how_use_intro: "Gemsutopia uses cookies for the following purposes:",
    how_use_essential: "Essential Cookies: Required for basic website functionality, shopping cart, and checkout process",
    how_use_performance: "Performance Cookies: Help us understand how visitors interact with our website by collecting anonymous information",
    how_use_functional: "Functional Cookies: Remember your preferences and settings to enhance your experience",
    how_use_marketing: "Marketing Cookies: Used to deliver relevant advertisements and track campaign effectiveness",
    types_title: "Types of Cookies We Use",
    essential_subtitle: "Essential Cookies",
    essential_content: "These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting privacy preferences, logging in, or filling in forms.",
    analytics_subtitle: "Analytics Cookies",
    analytics_content: "We use analytics cookies to understand how visitors use our website. This helps us improve our website performance and user experience. All information collected is anonymous.",
    marketing_subtitle: "Marketing Cookies",
    marketing_content: "These cookies track your browsing activity to help us show you relevant advertisements. They may be set by us or third-party advertising partners.",
    managing_title: "Managing Your Cookie Preferences",
    managing_intro: "You can control and manage cookies in several ways:",
    managing_browser: "Browser Settings: Most browsers allow you to control cookies through their settings preferences",
    managing_settings: "Cookie Settings: Use our Cookie Settings page to manage your preferences",
    managing_optout: "Opt-Out: You can opt-out of certain cookies, though this may affect website functionality",
    managing_note: "Please note that disabling certain cookies may impact your browsing experience and prevent some features from working properly.",
    third_party_title: "Third-Party Cookies",
    third_party_intro: "Some cookies on our website are set by third-party services we use, such as:",
    third_party_analytics: "Google Analytics (for website analytics)",
    third_party_payment: "Payment processors (for secure transactions)",
    third_party_social: "Social media platforms (for social sharing features)",
    third_party_email: "Email marketing services (for newsletter functionality)",
    retention_title: "Cookie Retention",
    retention_intro: "Cookies remain on your device for different periods depending on their type:",
    retention_session: "Session Cookies: Deleted when you close your browser",
    retention_persistent: "Persistent Cookies: Remain for a set period or until you delete them",
    retention_essential_time: "Essential Cookies: Typically expire after 1 year",
    retention_analytics_time: "Analytics Cookies: Usually expire after 2 years",
    consent_title: "Your Consent",
    consent_content: "By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by adjusting your cookie settings or browser preferences.",
    updates_title: "Updates to This Policy",
    updates_content: "We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We encourage you to review this page periodically.",
    contact_title: "Contact Us",
    contact_content: "If you have any questions about our use of cookies, please contact us at gemsutopia@gmail.com."
  };

  // Use CMS content if available, otherwise fall back to defaults
  const getContent = (key: string): string => content[key] || defaultContent[key] || '';
  return (
    <div className="min-h-[200vh] flex flex-col relative">
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
            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('what_are_title')}</h2>
              <p>
                {getContent('what_are_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('how_use_title')}</h2>
              <p>{getContent('how_use_intro')}</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>{getContent('how_use_essential')}</strong></li>
                <li><strong>{getContent('how_use_performance')}</strong></li>
                <li><strong>{getContent('how_use_functional')}</strong></li>
                <li><strong>{getContent('how_use_marketing')}</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('types_title')}</h2>
              
              <h3 className="text-lg font-semibold text-black mb-2">{getContent('essential_subtitle')}</h3>
              <p className="mb-4">
                {getContent('essential_content')}
              </p>

              <h3 className="text-lg font-semibold text-black mb-2">{getContent('analytics_subtitle')}</h3>
              <p className="mb-4">
                {getContent('analytics_content')}
              </p>

              <h3 className="text-lg font-semibold text-black mb-2">{getContent('marketing_subtitle')}</h3>
              <p className="mb-4">
                {getContent('marketing_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('managing_title')}</h2>
              <p>
                {getContent('managing_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>{getContent('managing_browser')}</strong></li>
                <li><strong>{getContent('managing_settings')}</strong></li>
                <li><strong>{getContent('managing_optout')}</strong></li>
              </ul>
              <p>
                {getContent('managing_note')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('third_party_title')}</h2>
              <p>
                {getContent('third_party_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>{getContent('third_party_analytics')}</li>
                <li>{getContent('third_party_payment')}</li>
                <li>{getContent('third_party_social')}</li>
                <li>{getContent('third_party_email')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('retention_title')}</h2>
              <p>
                {getContent('retention_intro')}
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>{getContent('retention_session')}</strong></li>
                <li><strong>{getContent('retention_persistent')}</strong></li>
                <li><strong>{getContent('retention_essential_time')}</strong></li>
                <li><strong>{getContent('retention_analytics_time')}</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('consent_title')}</h2>
              <p>
                {getContent('consent_content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">{getContent('updates_title')}</h2>
              <p>
                {getContent('updates_content')}
              </p>
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