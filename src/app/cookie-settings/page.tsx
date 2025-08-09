'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCookies } from '@/contexts/CookieContext';

export default function CookieSettings() {
  const { preferences, updatePreferences, acceptAll, rejectAll } = useCookies();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

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
    <div className="bg-black min-h-screen flex flex-col">
      <Header />
      
      <div 
        className="flex-grow py-16"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Cookie Settings</h1>
              <p className="text-lg text-neutral-600">Manage your cookie preferences</p>
            </div>
            
            {saved && (
              <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-center">
                ✅ Cookie preferences saved successfully!
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            <div className="text-neutral-700">
              <p className="mb-6">
                We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. 
                You can customize your cookie preferences below. Please note that disabling certain cookies may impact 
                your experience on our website.
              </p>
            </div>

            {/* Essential Cookies */}
            <div className="border-b border-neutral-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">Essential Cookies</h3>
                  <p className="text-neutral-600 text-sm">
                    These cookies are necessary for the website to function and cannot be switched off. 
                    They are usually set in response to actions made by you such as setting your privacy preferences, 
                    logging in, or filling in forms.
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
                    <span className="ml-2 text-sm text-neutral-500">Always Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border-b border-neutral-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">Analytics Cookies</h3>
                  <p className="text-neutral-600 text-sm">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously. This helps us improve our website performance 
                    and user experience.
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
                  <h3 className="text-lg font-semibold text-black mb-2">Marketing Cookies</h3>
                  <p className="text-neutral-600 text-sm">
                    These cookies track your browsing activity to help us show you relevant advertisements 
                    and measure the effectiveness of our marketing campaigns. They may be set by us or 
                    third-party advertising partners.
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
                  <h3 className="text-lg font-semibold text-black mb-2">Functional Cookies</h3>
                  <p className="text-neutral-600 text-sm">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your preferences and settings. They may be set by us or by third-party providers 
                    whose services we use on our pages.
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
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="bg-neutral-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectAll}
                className="bg-neutral-200 text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-300 transition-colors"
              >
                Reject All (except Essential)
              </button>
            </div>

            <div className="text-sm text-neutral-600 pt-4 border-t border-neutral-200">
              <p>
                <strong>Need more information?</strong> Visit our{' '}
                <a href="/cookie-policy" className="text-black underline hover:no-underline">
                  Cookie Policy
                </a>{' '}
                for detailed information about how we use cookies.
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