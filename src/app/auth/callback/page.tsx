'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Force dynamic page
export const dynamic = 'force-dynamic';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/sign-in?error=confirmation_failed');
          return;
        }

        if (data.session) {
          // User successfully confirmed email
          router.push('/?confirmed=true');
        } else {
          router.push('/sign-in');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        router.push('/sign-in?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        <p className="mt-2 text-gray-600">Confirming your account...</p>
      </div>
    </div>
  );
}