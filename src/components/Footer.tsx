'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCcAmex, faCcApplePay, faCcDiscover, faCcDinersClub, faCcMastercard, faCcPaypal, faCcStripe, faCcVisa } from '@fortawesome/free-brands-svg-icons';
import { ExchangeCoinbase } from '@web3icons/react';
import Image from 'next/image';
import { useState } from 'react';
import '../../styles/footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');


  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setSubscriptionStatus('error');
      setStatusMessage('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    setSubscriptionStatus('idle');
    
    try {
      // TODO: Implement newsletter signup with Mailchimp later
      // For now, just show success message without sending email
      setSubscriptionStatus('success');
      setStatusMessage('Thank you for subscribing! We will keep you updated.');
      setEmail('');
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setSubscriptionStatus('error');
      setStatusMessage('An error occurred. Please try again.');
    } finally {
      setIsSubscribing(false);
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setSubscriptionStatus('idle');
        setStatusMessage('');
      }, 5000);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md text-white w-full min-h-[50vh] flex flex-col justify-between border-t border-white/20 relative z-10 footer-container">
        <div className="w-full pt-8 px-4">
        <div className="max-w-7xl mx-auto flex justify-start items-center">
          <Image
            src="/logos/gem.png"
            alt="Gem"
            width={40}
            height={40}
            className="w-auto h-6 object-contain"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 w-full md:hidden ">
        <div className="mb-8 mt-4 divide-y divide-white/20 ">
          <details className="group py-3">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="text-white text-sm font-semibold">Business</span>
              <span className="text-white text-sm group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="mt-3 space-y-2">
              <a href="/about" className="block text-white text-sm hover:text-gray-300">About</a>
              <a href="/contact-us" className="block text-white text-sm hover:text-gray-300">Contact Us</a>
            </div>
          </details>
          <details className="group py-3">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="text-white text-sm font-semibold">Support</span>
              <span className="text-white text-sm group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="mt-3 space-y-2">
              <a href="/support" className="block text-white text-sm hover:text-gray-300">Help Center</a>
              <a href="/refund-policy" className="block text-white text-sm hover:text-gray-300">Refund Policy</a>
            </div>
          </details>
          <details className="group py-3">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="text-white text-sm font-semibold">Legal</span>
              <span className="text-white text-sm group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="mt-3 space-y-2">
              <a href="/terms-of-service" className="block text-white text-sm hover:text-gray-300">Terms of Service</a>
              <a href="/privacy-policy" className="block text-white text-sm hover:text-gray-300">Privacy Policy</a>
            </div>
          </details>
          <details className="group py-3">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="text-white text-sm font-semibold">Cookies</span>
              <span className="text-white text-sm group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="mt-3 space-y-2">
              <a href="/cookie-policy" className="block text-white text-sm hover:text-gray-300">Cookie Policy</a>
              <a href="/cookie-settings" className="block text-white text-sm hover:text-gray-300">Cookie Settings</a>
            </div>
          </details>
        </div>
      </div>
      <div className="w-full hidden md:block px-4">
        <div className="max-w-7xl mx-auto mt-12">
          <div className="grid grid-cols-4 gap-6 mb-2">
            <h4 className="text-white text-sm font-semibold">Business</h4>
            <h4 className="text-white text-sm font-semibold">Support</h4>
            <h4 className="text-white text-sm font-semibold">Legal</h4>
            <h4 className="text-white text-sm font-semibold">Cookies</h4>
          </div>
          <div className="border-b border-white/20 mb-6"></div>
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <a href="/about" className="text-white text-sm hover:text-gray-300">About</a>
              <a href="/contact-us" className="text-white text-sm hover:text-gray-300">Contact Us</a>
            </div>
            <div className="flex flex-col gap-2">
              <a href="/support" className="text-white text-sm hover:text-gray-300">Help Center</a>
              <a href="/refund-policy" className="text-white text-sm hover:text-gray-300">Refund Policy</a>
            </div>
            <div className="flex flex-col gap-2">
              <a href="/terms-of-service" className="text-white text-sm hover:text-gray-300">Terms of Service</a>
              <a href="/privacy-policy" className="text-white text-sm hover:text-gray-300">Privacy Policy</a>
            </div>
            <div className="flex flex-col gap-2">
              <a href="/cookie-policy" className="text-white text-sm hover:text-gray-300">Cookie Policy</a>
              <a href="/cookie-settings" className="text-white text-sm hover:text-gray-300">Cookie Settings</a>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full pb-8 md:pb-0  px-4">
        <div className="max-w-7xl mx-auto space-y-4 ">
          
          {statusMessage && (
            <div className={`mb-4 p-3 rounded text-sm ${
              subscriptionStatus === 'success' 
                ? 'bg-green-900 text-green-100 border border-green-700' 
                : 'bg-red-900 text-red-100 border border-red-700'
            }`}>
              {statusMessage}
            </div>
          )}
          
          <form onSubmit={handleNewsletterSignup} className="mb-6">
            <div className="border border-white/20 h-10 rounded flex items-center overflow-hidden">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Stay updated with exclusive offers and new arrivals"
                className="flex-1 h-full px-3 text-white/40 bg-transparent border-none outline-none placeholder-white/40 focus:text-white"
                disabled={isSubscribing}
                suppressHydrationWarning={true}
              />
              <button 
                type="submit"
                disabled={isSubscribing}
                className="bg-white/10 text-white px-12 h-full text-sm font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>
          <div className="pt-4 pb-4 md:pb-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 ">
              <p className="text-sm text-left ">© 2025 Gemsutopia.</p>
              <div className="flex flex-wrap justify-start md:justify-end gap-4 ">
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcStripe} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcVisa} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcMastercard} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcAmex} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcDiscover} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcDinersClub} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcPaypal} />
                </div>
                <div className="text-white/60 text-2xl">
                  <FontAwesomeIcon icon={faCcApplePay} />
                </div>
                <div className="text-white/60 text-2xl flex items-center">
                  <Image src="/icons/google-pay.svg" alt="Google Pay" width={28} height={28} className="opacity-60" />
                </div>
                <div className="text-white/60 text-2xl">
                  <ExchangeCoinbase variant="mono" size={28} color="#FFFFFF99"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}