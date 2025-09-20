'use client';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, KeyRound } from 'lucide-react';

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
        body: JSON.stringify({
          email,
          passcode,
          captchaToken: 'bypassed' // Skip captcha requirement
        }),
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
    <div className="h-screen flex items-center justify-center px-4 relative">
      {/* Fixed Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-white">Gemsutopia Content Management</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-12" autoComplete="off">
          <div className="space-y-8">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Authorized Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-white bg-transparent text-white placeholder-white focus:outline-none"
                  placeholder="Enter authorized email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-white mb-2">
                Access Passcode
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white" />
                <input
                  id="passcode"
                  name="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-transparent border border-white rounded-lg text-white placeholder-white focus:outline-none"
                  placeholder="Enter access passcode"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  {showPasscode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-white rounded-lg shadow-sm text-sm font-medium text-white bg-transparent hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 enabled:hover:bg-white enabled:hover:text-black"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

