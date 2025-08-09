'use client';
import { IconMenu2 } from '@tabler/icons-react';
import { Star, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Dropdown from './Dropdown';
import { useGemPouch } from '../contexts/GemPouchContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCMSContent } from '@/hooks/useCMSContent';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { itemCount } = useGemPouch();
  const { itemCount: wishlistCount } = useWishlist();
  const { getContent } = useCMSContent();
  const pathname = usePathname();
  
  // Get marquee settings
  const marqueeEnabled = getContent('marquee', 'enabled') !== 'false'; // Show by default
  const marqueeText = getContent('marquee', 'text') || '🎉 Grand Opening Sale - Up to 25% Off All Items! 🎉';
  const gradientFrom = getContent('marquee', 'gradient_from') || '#9333ea'; // purple-600
  const gradientTo = getContent('marquee', 'gradient_to') || '#db2777'; // pink-600
  
  // Add drop shadow to all pages except front page
  const isHomePage = pathname === '/';
  const headerClass = isHomePage 
    ? "bg-black text-white relative m-0 border-b border-white/20"
    : "bg-black text-white relative m-0 border-b border-white/20 shadow-lg";

  return (
    <header className={headerClass}>
      {marqueeEnabled && (
        <div 
          className="text-white py-1 overflow-hidden"
          style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
        >
          <div className="flex animate-scroll whitespace-nowrap">
            {Array.from({ length: 8 }).map((_, index) => (
              <p key={index} className="text-sm font-medium px-8">
                {marqueeText}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="cursor-pointer">
              <Image 
                src="/logos/gem.png" 
                alt="Gem"
                width={48}
                height={48}
                className="w-auto h-8 object-contain"
              />
            </Link>
          </div>
          <div className="flex-1 flex justify-start pl-8">
            <div className="hidden md:flex items-center gap-6">
              <a href="/shop" className="text-white hover:text-gray-300 text-sm font-bold">Shop</a>
              <a href="/about" className="text-white hover:text-gray-300 text-sm font-bold">About</a>
              <a href="/contact-us" className="text-white hover:text-gray-300 text-sm font-bold">Contact</a>
              <a href="/support" className="text-white hover:text-gray-300 text-sm font-bold">Support</a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              className="text-white hover:text-gray-300 md:hidden"
              onClick={() => setIsDropdownOpen(true)}
            >
              <IconMenu2 className="h-8 w-8" />
            </button>
            <div className="hidden md:flex items-center gap-4">
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
              <a href="/sign-up" className="border border-white text-white hover:bg-white hover:text-black active:bg-white active:text-black text-sm font-bold px-10 py-2 rounded-full transition-all">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Dropdown 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
      />
    </header>
  );
}