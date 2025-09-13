'use client';
import { useState, useEffect } from 'react';
import { useMode } from '@/lib/contexts/ModeContext';
import { usePathname } from 'next/navigation';
import { Settings, RefreshCw } from 'lucide-react';
import '../../styles/maintenanceoverlay.css';

const maintenanceMessages = [
  "Counting our gems twice",
  "Teaching our website new tricks",
  "Untangling the server cables",
  "Asking crystals for good wifi vibes",
  "Updating our gem database",
  "Fixing our shopping cart wheels",
  "Convincing payments to be nice",
  "Organizing our digital treasure",
  "Feeding the server hamsters",
  "Checking diamonds are still forever"
];

export default function MaintenanceOverlay() {
  const { mode } = useMode();
  const pathname = usePathname();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Check if current page should be excluded from maintenance mode
  const isAdminPage = pathname?.startsWith('/admin') || false;

  // Cycle through maintenance messages
  useEffect(() => {
    if (mode === 'dev' && !isAdminPage) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => 
          (prev + 1) % maintenanceMessages.length
        );
      }, 30000); // Change message every 30 seconds

      return () => clearInterval(interval);
    }
  }, [mode, isAdminPage]);

  // Handle visibility with smooth transition and body scroll lock
  useEffect(() => {
    if (mode === 'dev' && !isAdminPage) {
      setIsVisible(true);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Restore body scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      // Delay hiding to allow fade out animation
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [mode, isAdminPage]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-all duration-500 maintenance-overlay ${
        mode === 'dev'
          ? 'opacity-100 backdrop-blur-md'
          : 'opacity-0 pointer-events-none'
      }`}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onScroll={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Background overlay with glass effect */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md maintenance-background"
      />
      
      {/* Content container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md mx-auto">

          {/* Main title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Under Maintenance
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-white/80 mb-8">
            Site temporarily unavailable
          </p>

          {/* Animated loader */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>

          {/* Rotating messages */}
          <div className="h-8 flex items-center justify-center">
            <p 
              key={currentMessageIndex}
              className="text-white/70 animate-pulse transition-all duration-1000 text-lg"
            >
              {maintenanceMessages[currentMessageIndex]}
            </p>
          </div>

          {/* Additional info */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/50 text-sm">
              We'll be back shortly. Thank you for your patience.
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        </div>
      </div>

    </div>
  );
}