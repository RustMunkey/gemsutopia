'use client';
import { IconMenu2 } from '@tabler/icons-react';
import { Star, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Dropdown from './Dropdown';
import { useGemPouch } from '../contexts/GemPouchContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCMSContent } from '@/hooks/useCMSContent';
import { useAuth } from '../contexts/AuthContext';
import CurrencySwitcher from './CurrencySwitcher';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { itemCount } = useGemPouch();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, signOut } = useAuth();
  const { getContent, loading } = useCMSContent();
  const pathname = usePathname();
  
  // Get marquee settings - only show marquee after content loads and if enabled
  const marqueeEnabled = !loading && getContent('marquee', 'enabled') !== 'false';
  const marqueeText = getContent('marquee', 'text') || 'Grand Opening Sale - Up to 25% Off All Items!';
  const gradientFrom = getContent('marquee', 'gradient_from') || '#000000';
  const gradientTo = getContent('marquee', 'gradient_to') || '#000000';
  
  // Add drop shadow to all pages except front page
  const isHomePage = pathname === '/';
  const isShopPage = pathname === '/shop';
  const isProductPage = pathname.startsWith('/product/');
  const headerClass = isHomePage 
    ? "bg-black text-white relative m-0 border-b border-white/20"
    : "bg-black text-white relative m-0 border-b border-white/20 shadow-lg";

  return (
    <header className={headerClass}>
      {marqueeEnabled && (
        <div 
          className="text-white py-2 overflow-hidden relative"
          style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
        >
          <div className="animate-scroll-forward whitespace-nowrap">
            <span className="inline-block text-xs sm:text-sm font-medium">
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              ✈️ {marqueeText} ✈️&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo (left side) / Back button on product pages */}
          <div className="flex items-center">
            {isProductPage ? (
              <Link href="/shop" className="cursor-pointer text-white hover:text-gray-300">
                <ArrowLeft className="h-6 w-6" strokeWidth={2} />
              </Link>
            ) : (
              <Link href="/" className="cursor-pointer">
                <Image 
                  src="/logos/gem.png" 
                  alt="Gem"
                  width={32}
                  height={32}
                  className="w-auto h-6 object-contain"
                />
              </Link>
            )}
          </div>
          
          {/* Desktop navigation */}
          <div className="flex-1 flex justify-start pl-8">
            <div className="hidden md:flex items-center gap-6">
              <a href="/shop" className="text-white hover:text-gray-300 text-sm font-bold">Shop</a>
              <a href="/about" className="text-white hover:text-gray-300 text-sm font-bold">About</a>
              <a href="/contact-us" className="text-white hover:text-gray-300 text-sm font-bold">Contact</a>
              <a href="/support" className="text-white hover:text-gray-300 text-sm font-bold">Support</a>
            </div>
          </div>
          
          {/* Right side items */}
          <div className="flex items-center gap-6">
            {/* Mobile hamburger and Shop button/Shopping bag/Back button */}
            <div className="md:hidden flex items-center gap-4">
              {isProductPage ? (
                <div className="flex items-center gap-4">
                  <CurrencySwitcher variant="header" />
                  <a href="/wishlist" className="text-white hover:text-gray-300 flex items-center gap-2 relative">
                    {wishlistCount > 0 ? (
                      <Star fill="white" className="h-6 w-6" strokeWidth={2} />
                    ) : (
                      <Star className="h-6 w-6" strokeWidth={2} />
                    )}
                  </a>
                  <a href="/gem-pouch" className="text-white hover:text-gray-300 flex items-center gap-2 relative">
                    <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </a>
                </div>
              ) : !isShopPage ? (
                <>
                  <CurrencySwitcher variant="header" />
                  <a href="/shop" className="border border-white text-white md:bg-transparent md:text-white hover:bg-white hover:text-black active:bg-white active:text-black text-sm font-bold px-10 py-2 rounded-full transition-all">
                    Shop
                  </a>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <CurrencySwitcher variant="header" />
                  <a href="/wishlist" className="text-white hover:text-gray-300 flex items-center gap-2 relative">
                    {wishlistCount > 0 ? (
                      <Star fill="white" className="h-6 w-6" strokeWidth={2} />
                    ) : (
                      <Star className="h-6 w-6" strokeWidth={2} />
                    )}
                  </a>
                  <a href="/gem-pouch" className="text-white hover:text-gray-300 flex items-center gap-2 relative">
                    <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </a>
                </div>
              )}
              <button 
                className="text-white hover:text-gray-300"
                onClick={() => setIsDropdownOpen(true)}
              >
                <IconMenu2 className="h-8 w-8" />
              </button>
            </div>
            
            {/* Desktop items */}
            <div className="hidden md:flex items-center gap-6">
              <CurrencySwitcher variant="header" />
              <a href="/wishlist" className="text-white hover:text-gray-300 flex items-center gap-2 relative">
                {wishlistCount > 0 ? (
                  <Star fill="white" className="h-6 w-6" strokeWidth={2} />
                ) : (
                  <Star className="h-6 w-6" strokeWidth={2} />
                )}
              </a>
              <a href="/gem-pouch" className="text-white hover:text-gray-300 flex items-center gap-2 relative">
                <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </a>
              <div className="flex items-center gap-3">
                {user && (
                  <span className="text-white text-sm">
                    Hi, {user.user_metadata?.first_name || user.email?.split('@')[0]}!
                  </span>
                )}
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="border border-white text-white hover:bg-white hover:text-black text-sm font-bold px-10 py-2 rounded-full transition-all"
                  >
                    Sign Out
                  </button>
                ) : pathname === '/sign-up' ? (
                  <a href="/sign-in" className="border border-white text-white hover:bg-white hover:text-black text-sm font-bold px-10 py-2 rounded-full transition-all">
                    Sign In
                  </a>
                ) : (
                  <a href="/sign-up" className="border border-white text-white hover:bg-white hover:text-black text-sm font-bold px-10 py-2 rounded-full transition-all">
                    Sign Up
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isDropdownOpen && (
        <Dropdown 
          isOpen={isDropdownOpen} 
          onClose={() => setIsDropdownOpen(false)} 
        />
      )}
    </header>
  );
}