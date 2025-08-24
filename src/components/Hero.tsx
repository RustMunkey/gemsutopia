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
  const [touchOffset, setTouchOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const scrollToSlide = (index: number) => {
    setCurrentIndex(index);
    setTouchOffset(0);
    setIsDragging(false);
  };

  const nextSlide = () => {
    const newIndex = (currentIndex + 1) % images.length;
    scrollToSlide(newIndex);
  };

  const prevSlide = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    scrollToSlide(newIndex);
  };

  // Touch handlers for swipe with drag follow
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
    setTouchOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = currentTouch - touchStart;
    setTouchOffset(diff);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 10; // Very small threshold

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    setTouchStart(null);
    setTouchOffset(0);
    setIsDragging(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth } = scrollRef.current;
        const index = Math.round(scrollLeft / clientWidth);
        setCurrentIndex(index);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Reset to first slide when images change
  useEffect(() => {
    setCurrentIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [images.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (images.length === 0 || loading) return;

    const interval = setInterval(() => {
      const newIndex = (currentIndex + 1) % images.length;
      scrollToSlide(newIndex);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [currentIndex, images.length, loading]);

  // Show loading state or empty state
  if (loading || images.length === 0) {
    return (
      <section className="bg-black h-[68vh] sm:h-[63vh] md:h-[72vh] lg:h-[77vh] flex-shrink-0 overflow-hidden">
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
    <section className="bg-black h-[68vh] sm:h-[63vh] md:h-[72vh] lg:h-[77vh] flex-shrink-0 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className="w-full h-full flex items-center justify-center relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
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
            
            {/* Slider with 3-image preview */}
            <div 
              ref={scrollRef}
              className="w-full h-full overflow-hidden relative"
            >
              {/* Mobile: Swipeable carousel */}
              <div className="w-full h-full md:hidden relative overflow-hidden">
                <div 
                  className="flex h-full"
                  style={{
                    transform: `translateX(-${currentIndex * 100}vw) translateX(${touchOffset}px)`,
                    width: `${images.length * 100}vw`,
                    transition: isDragging ? 'none' : 'transform 0.5s ease-in-out'
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
              
              {/* Desktop 3-image preview */}
              <div className="hidden md:flex h-full items-center absolute inset-0">
                {/* Previous Image - Left side, partially visible */}
                <div 
                  className="absolute left-0 top-0 h-full w-1/4 md:w-1/3 opacity-50 transition-all duration-300 z-10"
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
                  <div className="w-full h-full px-0 sm:px-0.5 md:px-24 lg:px-40">
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
                  className="absolute right-0 top-0 h-full w-1/4 md:w-1/3 opacity-50 transition-all duration-300 z-10"
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
                    onClick={() => scrollToSlide(index)}
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