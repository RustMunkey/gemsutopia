'use client';
import { useState, useEffect } from 'react';
import { IconEye, IconEyeOff, IconMail, IconKey } from '@tabler/icons-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearCredentials = () => {
    setEmail('');
    setPasscode('');
    setError('');
  };

  // Clear credentials and remove any existing tokens on mount
  useEffect(() => {
    clearCredentials();
    localStorage.removeItem('admin-token');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, passcode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage for client-side auth
        localStorage.setItem('admin-token', data.token);

        // Force a hard refresh to ensure clean state
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  // If authenticated, this will be handled by redirect in useEffect

  return (
    <div className="flex h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold text-white">Admin Access</h2>
          <p className="text-white">Gemsutopia Content Management</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-12" autoComplete="off">
          <div className="space-y-8">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">
                Authorized Email
              </label>
              <div className="relative">
                <IconMail
                  size={20}
                  className="absolute top-1/2 left-3 -translate-y-1/2 transform text-white"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white bg-transparent py-3 pr-4 pl-10 text-white placeholder-white focus:outline-none"
                  placeholder="Enter authorized email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="passcode" className="mb-2 block text-sm font-medium text-white">
                Access Passcode
              </label>
              <div className="relative">
                <IconKey
                  size={20}
                  className="absolute top-1/2 left-3 -translate-y-1/2 transform text-white"
                />
                <input
                  id="passcode"
                  name="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className="w-full rounded-lg border border-white bg-transparent py-3 pr-12 pl-10 text-white placeholder-white focus:outline-none"
                  placeholder="Enter access passcode"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 transform text-white hover:text-gray-300"
                >
                  {showPasscode ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg border border-white bg-transparent px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-white hover:text-black focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black focus:outline-none enabled:hover:bg-white enabled:hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
