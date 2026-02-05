'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const [isDevMode] = useState(process.env.NODE_ENV !== 'production');
  const [bypassLoading, setBypassLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const messages: Record<string, string> = {
        unauthorized: 'Your email is not authorized to access this admin panel.',
        auth_failed: 'Authentication failed. Please try again.',
        session_expired: 'Your session has expired. Please sign in again.',
      };
      toast.error(messages[error] || 'An error occurred');
    }
  }, [error]);

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google/login';
  };

  const handleDevBypass = async () => {
    setBypassLoading(true);
    try {
      const res = await fetch('/api/auth/dev-bypass', { method: 'POST' });
      if (res.ok) {
        toast.success('Dev bypass activated');
        router.push('/dashboard');
      } else {
        toast.error('Dev bypass failed');
      }
    } catch {
      toast.error('Dev bypass failed');
    } finally {
      setBypassLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              GEMSUTOPIA
            </h1>
            <p className="text-gray-500 mt-2">Admin Dashboard</p>
          </div>

          {/* Login content */}
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Sign in with your authorized Google account
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium group-hover:text-gray-900">
                Sign in with Google
              </span>
            </button>

            {/* Dev Bypass - Only in development */}
            {isDevMode && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleDevBypass}
                  disabled={bypassLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  {bypassLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Bypassing...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">⚡</span>
                      DEV BYPASS (Skip Auth)
                    </>
                  )}
                </button>
                <p className="text-xs text-yellow-600 text-center mt-2">
                  Development mode only - remove before production
                </p>
              </div>
            )}

            {/* Authorized emails info */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                Only authorized administrators can access this dashboard.
                <br />
                Contact the dev team if you need access.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Gemsutopia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
