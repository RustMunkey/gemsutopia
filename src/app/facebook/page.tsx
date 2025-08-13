'use client';
import { ArrowLeftToLine } from 'lucide-react';
import { useEffect } from 'react';

export default function Facebook() {
  useEffect(() => {
    // Disable scrolling when component mounts
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center relative fixed inset-0"
      style={{
        backgroundImage: 'url(/images/whitemarble.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <button 
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 hover:opacity-70 transition-opacity"
      >
        <ArrowLeftToLine className="w-8 h-8 sm:w-6 sm:h-6 text-black" />
      </button>
      <div className="flex gap-24">
        <div className="flex flex-col items-center">
          <a 
            href="https://www.facebook.com/profile.php?id=100089199956397" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-32 h-32 bg-white rounded-full overflow-hidden block hover:opacity-80 hover:scale-110 transition-all duration-300 transform"
          >
            <img 
              src="/pfp/business.jpg" 
              alt="Business profile picture"
              className="w-full h-full object-cover"
            />
          </a>
          <p className="text-black mt-4 font-semibold">Business</p>
        </div>
        <div className="flex flex-col items-center">
          <a 
            href="https://www.facebook.com/ReeseRoberge10" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-32 h-32 bg-white rounded-full overflow-hidden block hover:opacity-80 hover:scale-110 transition-all duration-300 transform"
          >
            <img 
              src="/pfp/reese.jpg" 
              alt="Reese profile picture"
              className="w-full h-full object-cover"
            />
          </a>
          <p className="text-black mt-4 font-semibold">Personal</p>
        </div>
      </div>
    </div>
  );
}