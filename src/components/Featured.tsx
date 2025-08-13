'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCMSContent } from '@/hooks/useCMSContent';
import { extractVibrantColor } from '@/utils/colorExtraction';

interface FeaturedProduct {
  id: string;
  name: string;
  type: string;
  description: string;
  image_url: string;
  card_color?: string;
  price: number;
  original_price: number;
  product_id?: number;
  sort_order: number;
  is_active: boolean;
}

export default function Featured() {
  const router = useRouter();
  const { getContent } = useCMSContent();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [productColors, setProductColors] = useState<{ [key: string]: string }>({});
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [translateX, setTranslateX] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  
  // Function to determine if a color is light or dark
  const isLightColor = (hexColor: string): boolean => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch featured products from database
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/featured-products');
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        const data = await response.json();
        setFeaturedProducts(data);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        // Fallback to empty array
        setFeaturedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Extract colors from product images (only on client side)
  useEffect(() => {
    if (!isClient || featuredProducts.length === 0) return;
    
    const extractColors = async () => {
      const colors: { [key: string]: string } = {};
      
      for (const product of featuredProducts) {
        try {
          // Use custom card_color if set, otherwise extract from image
          if (product.card_color) {
            colors[product.id] = product.card_color;
          } else {
            const color = await extractVibrantColor(product.image_url);
            colors[product.id] = color;
          }
        } catch {
          colors[product.id] = '#8B5CF6'; // fallback - purple
        }
      }
      
      setProductColors(colors);
    };
    
    extractColors();
  }, [isClient, featuredProducts]);

  // No JavaScript animation needed - using pure CSS

  // Calculate normalized translate position for infinite loop
  const [cardWidth, setCardWidth] = useState(400);
  
  useEffect(() => {
    if (!isClient) return;
    
    const calculateCardWidth = () => {
      const width = window.innerWidth < 768 ? 
        (window.innerWidth * 0.5 - 12 + 16) : // Mobile: 50vw cards (same as shop)
        window.innerWidth < 1024 ? 
          (window.innerWidth * 0.3333 - 16 + 24) : // Medium: 33.33vw cards  
          (window.innerWidth * 0.25 - 16 + 24); // Large: 25vw cards
      setCardWidth(width);
    };
    
    calculateCardWidth();
    window.addEventListener('resize', calculateCardWidth);
    
    return () => {
      window.removeEventListener('resize', calculateCardWidth);
    };
  }, [isClient]);

  const oneSetWidth = featuredProducts.length * cardWidth;
  const normalizedTranslateX = oneSetWidth > 0 ? 
    ((translateX % oneSetWidth) + oneSetWidth) % oneSetWidth - oneSetWidth : 0;

  if (isLoading) {
    return (
      <section className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {getContent('featured', 'section_title') || 'Featured Gems'}
            </h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
              {getContent('featured', 'section_subtitle') || 'Discover our curated collection of premium gemstones'}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {getContent('featured', 'section_title') || 'Featured Gems'}
            </h2>
            <p className="text-lg text-neutral-300">
              No featured products available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {getContent('featured', 'section_title') || 'Featured Gems'}
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
            {getContent('featured', 'section_subtitle') || 'Discover our curated collection of premium gemstones'}
          </p>
        </div>
      </div>
        
      {/* Featured Products Display */}
      <div className="py-8 -mx-4 sm:-mx-6 lg:-mx-8">
        {(() => {
          const shouldCenter = featuredProducts.length <= 4;
          
          if (shouldCenter) {
            // Centered layout for 4 or fewer items
            return (
              <div className="flex justify-center items-stretch gap-4 flex-wrap max-w-6xl mx-auto px-4">
                {featuredProducts.map((product) => {
                  return (
                    <div key={product.id} className="flex-shrink-0 w-[320px]">
                      <div 
                        className="rounded-2xl p-3 transition-all duration-300 ease-out cursor-pointer product-card select-none h-[250px] md:h-[450px] flex flex-col bg-center bg-no-repeat mobile-card-bg"
                        style={{ 
                          backgroundImage: "url('/images/blackmarble.jpg?v=" + Date.now() + "')",
                          backgroundColor: '#2a2a2a'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = product.product_id || product.id;
                          router.push(`/product/${targetId}`);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <div className="w-full h-[200px] md:h-[350px] rounded-lg mb-1 overflow-hidden relative bg-transparent">
                          <Image 
                            src={product.image_url} 
                            alt={product.name}
                            fill
                            className="object-cover select-none pointer-events-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            sizes="280px"
                            quality={75}
                          />
                          <div className="absolute bottom-2 right-2 z-10">
                            <Image 
                              src="/logos/gems-logo.png" 
                              alt="Gemsutopia"
                              width={32}
                              height={32}
                              className="h-8 opacity-70 object-contain"
                            />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-black mb-1 text-center min-h-[2.5rem] flex items-center justify-center leading-tight">{product.name}</h3>
                        <p className="text-neutral-600 text-xs leading-relaxed flex-grow text-center overflow-hidden">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // Scrolling layout for more than 4 items
            return (
              <div className="overflow-hidden py-0 md:py-8">
                <div 
                  className="flex animate-scroll"
                >
                  {/* Triple the products for seamless infinite scroll */}
                  {featuredProducts.concat(featuredProducts).concat(featuredProducts).map((product, index) => {
                    return (
                      <div key={`${product.id}-${index}`} className="inline-block flex-shrink-0 w-[calc(50vw-0.75rem)] md:w-[calc(33.33vw-1rem)] lg:w-[calc(25vw-1rem)] mx-2 md:mx-3">
                        <div 
                          className="rounded-2xl p-3 border-2 border-white/30 transition-all duration-300 ease-out cursor-pointer product-card select-none h-[250px] md:h-[450px] flex flex-col"
                          style={{ backgroundColor: '#f0f0f0' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = product.product_id || product.id;
                            router.push(`/product/${targetId}`);
                            window.scrollTo(0, 0);
                          }}
                        >
                          <div className="w-full h-[200px] md:h-[350px] rounded-lg mb-1 overflow-hidden relative bg-transparent">
                            <Image 
                              src={product.image_url} 
                              alt={product.name}
                              fill
                              className="object-cover select-none pointer-events-none"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              quality={75}
                            />
                            <div className="absolute bottom-2 right-2 z-10">
                              <Image 
                                src="/logos/gems-logo.png" 
                                alt="Gemsutopia"
                                width={32}
                                height={32}
                                className="h-8 opacity-70 object-contain"
                              />
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-black mb-1 text-center min-h-[2.5rem] flex items-center justify-center leading-tight">{product.name}</h3>
                          <p className="text-neutral-600 text-xs leading-relaxed flex-grow text-center overflow-hidden md:block hidden">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        })()}
      </div>
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll {
          animation: scroll 8s linear infinite;
          will-change: transform;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        
        @media (hover: hover) and (pointer: fine) {
          .product-card:hover {
            transform: translateY(-8px) scale(1.02) !important;
            border-color: rgba(255, 255, 255, 0.6) !important;
          }
        }
        .mobile-card-bg {
          background-image: url('/images/blackmarble.jpg') !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-color: #2a2a2a !important;
        }
        
        .mobile-card-bg * {
          background-color: transparent !important;
        }
        
        @media (min-width: 768px) {
          .mobile-card-bg {
            background-image: url('/images/blackmarble.jpg') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-color: #2a2a2a !important;
          }
          
          .mobile-card-bg * {
            background-color: transparent !important;
          }
        }
        .product-card {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        .product-card img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
      `}</style>
    </section>
  );
}