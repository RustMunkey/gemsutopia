'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCookies } from '@/contexts/CookieContext';

export default function CookieSettings() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { preferences, updatePreferences, acceptAll, rejectAll } = useCookies();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/pages/cookie-settings')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  // Default content (existing content preserved)
  const defaultContent: Record<string, string> = {
    title: "Cookie Settings",
    subtitle: "Manage your cookie preferences",
    saved_message: "✅ Cookie preferences saved successfully!",
    intro_text: "We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. You can customize your cookie preferences below. Please note that disabling certain cookies may impact your experience on our website.",
    essential_title: "Essential Cookies",
    essential_description: "These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.",
    essential_status: "Always Active",
    analytics_title: "Analytics Cookies",
    analytics_description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website performance and user experience.",
    marketing_title: "Marketing Cookies",
    marketing_description: "These cookies track your browsing activity to help us show you relevant advertisements and measure the effectiveness of our marketing campaigns. They may be set by us or third-party advertising partners.",
    functional_title: "Functional Cookies",
    functional_description: "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. They may be set by us or by third-party providers whose services we use on our pages.",
    save_button: "Save Preferences",
    accept_all_button: "Accept All",
    reject_all_button: "Reject All (except Essential)",
    footer_text: "Need more information? Visit our",
    footer_link_text: "Cookie Policy",
    footer_text_end: "for detailed information about how we use cookies."
  };

  // Use CMS content if available, otherwise fall back to defaults
  const getContent = (key: string): string => content[key] || defaultContent[key] || '';

  const handleSavePreferences = () => {
    updatePreferences(localPreferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    setLocalPreferences({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
    acceptAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRejectAll = () => {
    setLocalPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
    rejectAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
              <p className="text-lg text-neutral-600">{getContent('subtitle')}</p>
            </div>
            
            {saved && (
              <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-center">
                {getContent('saved_message')}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            <div className="text-neutral-700">
              <p className="mb-6">
                {getContent('intro_text')}
              </p>
            </div>

            {/* Essential Cookies */}
            <div className="border-b border-neutral-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{getContent('essential_title')}</h3>
                  <p className="text-neutral-600 text-sm">
                    {getContent('essential_description')}
                  </p>
                </div>
                <div className="ml-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localPreferences.essential}
                      disabled
                      className="w-5 h-5 text-black bg-gray-100 border-gray-300 rounded focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-neutral-500">{getContent('essential_status')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border-b border-neutral-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{getContent('analytics_title')}</h3>
                  <p className="text-neutral-600 text-sm">
                    {getContent('analytics_description')}
                  </p>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.analytics}
                      onChange={(e) => setLocalPreferences({...localPreferences, analytics: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="border-b border-neutral-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{getContent('marketing_title')}</h3>
                  <p className="text-neutral-600 text-sm">
                    {getContent('marketing_description')}
                  </p>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.marketing}
                      onChange={(e) => setLocalPreferences({...localPreferences, marketing: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{getContent('functional_title')}</h3>
                  <p className="text-neutral-600 text-sm">
                    {getContent('functional_description')}
                  </p>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.functional}
                      onChange={(e) => setLocalPreferences({...localPreferences, functional: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neutral-200">
              <button
                onClick={handleSavePreferences}
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
              >
                {getContent('save_button')}
              </button>
              <button
                onClick={handleAcceptAll}
                className="bg-neutral-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors"
              >
                {getContent('accept_all_button')}
              </button>
              <button
                onClick={handleRejectAll}
                className="bg-neutral-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors"
              >
                {getContent('reject_all_button')}
              </button>
            </div>

            <div className="text-sm text-neutral-600 pt-4 border-t border-neutral-200">
              <p>
                <strong>{getContent('footer_text')}</strong>{' '}
                <a href="/cookie-policy" className="text-black underline hover:no-underline">
                  {getContent('footer_link_text')}
                </a>{' '}
                {getContent('footer_text_end')}
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}