'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { initEmailJS, sendSignUpConfirmationEmail } from '@/lib/emailjs';

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    initEmailJS();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setSubmitStatus('error');
      setStatusMessage('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitStatus('error');
      setStatusMessage('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      setSubmitStatus('error');
      setStatusMessage('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!formData.email.includes('@')) {
      setSubmitStatus('error');
      setStatusMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create account with Supabase Auth
      const { error: authError } = await signUp(formData.email, formData.password, {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        // Handle specific error cases
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('User already registered')) {
          setSubmitStatus('error');
          setStatusMessage('An account with this email already exists. Please sign in instead.');
          return;
        }
        
        if (authError.message?.includes('Password should be at least')) {
          setSubmitStatus('error');
          setStatusMessage('Password should be at least 6 characters long.');
          return;
        }

        if (authError.message?.includes('Invalid email')) {
          setSubmitStatus('error');
          setStatusMessage('Please enter a valid email address.');
          return;
        }
        
        setSubmitStatus('error');
        setStatusMessage(authError.message || 'Failed to create account. Please try again.');
        return;
      }

      // Send confirmation email
      const emailResult = await sendSignUpConfirmationEmail({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (emailResult.success) {
        setSubmitStatus('success');
        setStatusMessage('Account created successfully! Please check your email to confirm your account.');
      } else {
        setSubmitStatus('success');
        setStatusMessage('Account created successfully! Please check your email to confirm your account.');
      }
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
      });

    } catch (error) {
      console.error('Sign up error:', error);
      setSubmitStatus('error');
      setStatusMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      
      // Clear status message after 10 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setStatusMessage('');
      }, 10000);
    }
  };

  return (
    <div className="bg-black min-h-[200vh] flex flex-col">
      <Header />
      
      <div className="flex-grow py-16 flex items-center justify-center" style={{backgroundImage: 'url(/images/whitemarble.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black mb-2">Sign Up</h1>
              <p className="text-neutral-600">Create your Gemsutopia account</p>
            </div>

            {statusMessage && (
              <div className={`mb-6 p-4 rounded-lg text-sm ${
                submitStatus === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {statusMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your first name"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your last name"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Create a password"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-black focus:ring-black border-neutral-300 rounded"
                  disabled={isSubmitting}
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-neutral-700">
                  I agree to the{' '}
                  <a href="/terms-of-service" className="text-black hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="text-black hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-neutral-600">
                Already have an account?{' '}
                <a href="/sign-in" className="text-black font-semibold hover:underline">
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}