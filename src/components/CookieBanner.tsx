'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCookies } from '@/contexts/CookieContext';
import { X, Cookie } from 'lucide-react';

export default function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, dismissBanner } = useCookies();
  const [showDetails, setShowDetails] = useState(false);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 shadow-2xl z-50 border-t border-white/20">
      <div className="max-w-7xl mx-auto">
        {/* Close button */}
        <button
          onClick={dismissBanner}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                We use cookies
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                We use cookies to enhance your browsing experience, provide personalized content, 
                and analyze our traffic. By clicking &ldquo;Accept All&rdquo;, you consent to our use of cookies.
              </p>
              
              {showDetails && (
                <div className="mt-4 text-xs text-gray-400 space-y-2">
                  <p><strong>Essential:</strong> Required for basic functionality (always active)</p>
                  <p><strong>Analytics:</strong> Help us improve our website performance</p>
                  <p><strong>Marketing:</strong> Show you relevant ads and measure campaigns</p>
                  <p><strong>Functional:</strong> Remember your preferences and settings</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-300 hover:text-white underline transition-colors"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              
              <Link
                href="/cookie-settings"
                className="bg-transparent border border-white text-white text-sm px-4 py-2 rounded hover:bg-white hover:text-black transition-all text-center"
              >
                Customize
              </Link>
              
              <button
                onClick={rejectAll}
                className="bg-neutral-600 text-white text-sm px-4 py-2 rounded hover:bg-neutral-500 transition-colors"
              >
                Reject All
              </button>
              
              <button
                onClick={acceptAll}
                className="bg-white text-black text-sm px-6 py-2 rounded font-semibold hover:bg-gray-200 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}