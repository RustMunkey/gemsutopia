'use client';
import { IconStar, IconX } from '@tabler/icons-react';
import { ShoppingBag, Store, Info, Mail, HelpCircle } from 'lucide-react';
import Image from 'next/image';

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Dropdown({ isOpen, onClose }: DropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Dropdown */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 md:hidden transform transition-all duration-300 ease-in-out"
        onClick={onClose}
      >
        <div className="h-full flex flex-col relative" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-black py-3 overflow-hidden z-10">
            <div className="flex justify-center whitespace-nowrap">
              <p className="text-lg font-bold px-8 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent">
                GEMSUTOPIA
              </p>
            </div>
          </div>
          
          <div className="p-6 pt-12 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-8">
            <Image 
              src="/logos/gem.png" 
              alt="Gem"
              width={32}
              height={32}
              className="w-auto h-6 object-contain"
            />
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300"
            >
              <IconX className="h-8 w-8" />
            </button>
          </div>
          
          <nav className="space-y-6 flex-1 pl-2">
            <a
              href="/gem-pouch"
              className="flex items-center gap-3 text-white hover:text-gray-300 text-lg font-semibold"
              onClick={onClose}
            >
              <ShoppingBag className="h-5 w-5" />
              Gem Pouch
            </a>
            
            <a
              href="/wishlist"
              className="flex items-center gap-3 text-white hover:text-gray-300 text-lg font-semibold"
              onClick={onClose}
            >
              <IconStar className="h-5 w-5" />
              Wishlist
            </a>
            
            <a
              href="/shop"
              className="flex items-center gap-3 text-white hover:text-gray-300 text-lg font-semibold"
              onClick={onClose}
            >
              <Store className="h-5 w-5" />
              Shop
            </a>
            
            <a
              href="/about"
              className="flex items-center gap-3 text-white hover:text-gray-300 text-lg font-semibold"
              onClick={onClose}
            >
              <Info className="h-5 w-5" />
              About
            </a>
            <a
              href="/contact-us"
              className="flex items-center gap-3 text-white hover:text-gray-300 text-lg font-semibold"
              onClick={onClose}
            >
              <Mail className="h-5 w-5" />
              Contact
            </a>
            <a
              href="/support"
              className="flex items-center gap-3 text-white hover:text-gray-300 text-lg font-semibold"
              onClick={onClose}
            >
              <HelpCircle className="h-5 w-5" />
              Support
            </a>
          </nav>
          
          <div className="space-y-4 pb-8">
            <a
              href="/sign-in"
              className="block w-full text-center bg-transparent border border-white text-white py-3 px-10 rounded-full font-semibold hover:bg-white hover:text-black transition-all"
              onClick={onClose}
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="block w-full text-center bg-white text-black py-3 px-10 rounded-full font-semibold hover:bg-gray-200 transition-all"
              onClick={onClose}
            >
              Sign Up
            </a>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}