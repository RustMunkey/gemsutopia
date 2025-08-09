import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCcAmex, faCcApplePay, faCcDiscover, faGooglePay, faCcMastercard, faCcPaypal, faCcVisa, faInstagram, faFacebook, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { ExchangeCoinbase } from '@web3icons/react';
import Image from 'next/image';

export default function Footer() {
  return (
    <div className="bg-black text-white w-full h-[50vh] flex flex-col justify-between border-t border-white/20 relative" style={{ 
      filter: 'drop-shadow(0 -10px 20px rgba(0, 0, 0, 0.3))' 
    }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8">
        <div className="flex justify-between items-center">
          <Image 
            src="/logos/gem.png" 
            alt="Gem"
            width={40}
            height={40}
            className="w-auto h-6 object-contain"
          />
          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white text-xl hover:text-gray-300 transition-colors">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white text-xl hover:text-gray-300 transition-colors">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white text-xl hover:text-gray-300 transition-colors">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full md:hidden">
        <div className="mb-8 mt-4 divide-y divide-white/20">
          <details className="group py-3">
            <summary className="flex justify-between items-center cursor-pointer list-none">
              <span className="text-white text-sm font-semibold">Company</span>
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
              <a href="/support" className="block text-white text-sm hover:text-gray-300">Support</a>
              <a href="/refund-policy" className="block text-white text-sm hover:text-gray-300">Refund Policy</a>
              <a href="/returns-exchange" className="block text-white text-sm hover:text-gray-300">Returns & Exchange</a>
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
              <span className="text-white text-sm font-semibold">Preferences</span>
              <span className="text-white text-sm group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="mt-3 space-y-2">
              <a href="/cookie-policy" className="block text-white text-sm hover:text-gray-300">Cookie Policy</a>
              <a href="/cookie-settings" className="block text-white text-sm hover:text-gray-300">Cookie Settings</a>
            </div>
          </details>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full hidden md:block">
        <div className="grid grid-cols-4 gap-6 mb-8 mt-12">
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
            <div className="flex flex-col gap-2">
              <a href="/about" className="text-white text-sm hover:text-gray-300">About</a>
              <a href="/contact-us" className="text-white text-sm hover:text-gray-300">Contact Us</a>
            </div>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Support</h4>
            <div className="flex flex-col gap-2">
              <a href="/support" className="text-white text-sm hover:text-gray-300">Support</a>
              <a href="/refund-policy" className="text-white text-sm hover:text-gray-300">Refund Policy</a>
              <a href="/returns-exchange" className="text-white text-sm hover:text-gray-300">Returns & Exchange</a>
            </div>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Legal</h4>
            <div className="flex flex-col gap-2">
              <a href="/terms-of-service" className="text-white text-sm hover:text-gray-300">Terms of Service</a>
              <a href="/privacy-policy" className="text-white text-sm hover:text-gray-300">Privacy Policy</a>
            </div>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Preferences</h4>
            <div className="flex flex-col gap-2">
              <a href="/cookie-policy" className="text-white text-sm hover:text-gray-300">Cookie Policy</a>
              <a href="/cookie-settings" className="text-white text-sm hover:text-gray-300">Cookie Settings</a>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
        <div className="space-y-4">
          <div className="mt-8 mb-4">
            <p className="text-white text-left text-sm">Sign up for exclusive promotions, new arrivals, and special offers delivered straight to your inbox!</p>
          </div>
          <div className="border border-white h-10 mb-6 rounded flex items-center overflow-hidden">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 h-full px-3 text-gray-400 bg-transparent border-none outline-none placeholder-gray-400 focus:text-white"
              suppressHydrationWarning={true}
            />
            <button className="bg-white text-black px-8 h-full text-sm font-bold hover:bg-transparent hover:text-white hover:border-l hover:border-white transition-all">
              Subscribe
            </button>
          </div>
          <div className="pt-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <p className="text-sm text-center md:text-left">© 2025 Gemsutopia. All rights reserved.</p>
              <div className="flex flex-wrap justify-center md:justify-end gap-4">
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faCcAmex} />
                </div>
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faCcApplePay} />
                </div>
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faCcDiscover} />
                </div>
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faGooglePay} />
                </div>
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faCcMastercard} />
                </div>
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faCcPaypal} />
                </div>
                <div className="text-white text-2xl">
                  <FontAwesomeIcon icon={faCcVisa} />
                </div>
                <div className="text-white text-2xl">
                  <ExchangeCoinbase variant="mono" size={28} color="#FFFFFF"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}