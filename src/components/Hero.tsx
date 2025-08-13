'use client';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useCMSContent } from '@/hooks/useCMSContent';

export default function Hero() {
  const { getHeroImages, loading } = useCMSContent();
  
  // Get images from CMS
  const images = getHeroImages();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStart(null);
  };


  // Reset to first slide when images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [images.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (images.length === 0 || loading) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 15000); // 15 seconds per slide

    return () => clearInterval(interval);
  }, [currentIndex, images.length, loading]);

  // Show loading state or empty state
  if (loading || images.length === 0) {
    return (
      <section className="bg-black h-[60vh] sm:h-[50vh] md:h-[60vh] lg:h-[65vh] flex-shrink-0 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          ) : (
            <div className="text-center text-white">
              <p className="text-xl mb-2">No hero images available</p>
              <p className="text-slate-400">Upload images from the admin dashboard</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black h-[60vh] sm:h-[50vh] md:h-[60vh] lg:h-[65vh] flex-shrink-0 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className="w-full h-full flex items-center justify-center relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Left tap area - mobile only */}
            <button 
              onClick={prevSlide}
              className="absolute left-0 top-0 w-1/2 md:w-24 lg:w-40 h-full z-30 bg-transparent cursor-pointer md:cursor-default"
              aria-label="Previous slide"
            />
            
            {/* Right tap area - mobile only */}
            <button 
              onClick={nextSlide}
              className="absolute right-0 top-0 w-1/2 md:w-24 lg:w-40 h-full z-30 bg-transparent cursor-pointer md:cursor-default"
              aria-label="Next slide"
            />
            
            {/* Mobile: Sliding carousel */}
            <div 
              ref={scrollRef}
              className="w-full h-full overflow-hidden relative md:hidden"
            >
              <div 
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentIndex * 100}vw)`,
                  width: `${images.length * 100}vw`
                }}
              >
                {images.map((image, index) => (
                  <div 
                    key={index}
                    className="h-full flex-shrink-0 flex items-center justify-center"
                    style={{ width: '100vw' }}
                  >
                    <div className="w-full h-full px-2 py-4 flex items-center justify-center">
                      <div className="bg-neutral-700 rounded-2xl w-full h-full overflow-hidden relative">
                        <Image 
                          src={image}
                          alt={`Hero image ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="100vw"
                          quality={85}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: 3-image preview */}
            <div className="w-full h-full overflow-hidden relative hidden md:block">
              <div className="flex h-full items-center absolute inset-0">
                {/* Previous Image - Left side, partially visible */}
                <div 
                  className="absolute left-0 top-0 h-full w-1/3 opacity-50 transition-all duration-300 z-10"
                >
                  <div className="bg-neutral-700 rounded-2xl w-full h-full overflow-hidden relative">
                    <Image 
                      src={images[(currentIndex - 1 + images.length) % images.length]} 
                      alt={`Previous image`}
                      fill
                      className="object-cover"
                      sizes="25vw"
                      quality={60}
                    />
                  </div>
                </div>
                
                {/* Active Image - Center, focused */}
                <div 
                  className="absolute inset-0 flex items-center justify-center z-20"
                >
                  <div className="w-full h-full px-24 lg:px-40">
                    <div className="bg-neutral-700 rounded-2xl w-full h-full overflow-hidden relative">
                      <Image 
                        src={images[currentIndex]} 
                        alt={`Hero image ${currentIndex + 1}`}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                        quality={75}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Next Image - Right side, partially visible */}
                <div 
                  className="absolute right-0 top-0 h-full w-1/3 opacity-50 transition-all duration-300 z-10"
                >
                  <div className="bg-neutral-700 rounded-2xl w-full h-full overflow-hidden relative">
                    <Image 
                      src={images[(currentIndex + 1) % images.length]} 
                      alt={`Next image`}
                      fill
                      className="object-cover"
                      sizes="25vw"
                      quality={60}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pagination dots on top of image */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentIndex === index ? 'bg-black' : 'bg-neutral-600'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            
            {/* Watermark */}
            <div className="absolute bottom-4 right-4 md:right-8 z-20">
              <Image 
                src="/logos/gems-logo.png" 
                alt="Gemsutopia Watermark"
                width={64}
                height={64}
                className="h-16 object-contain"
              />
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .scrollbar-hide {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>
  );
}