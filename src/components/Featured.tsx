'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { ShoppingBag, Check } from 'lucide-react';
import { useCMSContent } from '@/hooks/useCMSContent';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  const { addItem, removeItem, isInPouch } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = featuredProducts.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: parseInt(product.product_id?.toString() || product.id),
      name: product.name,
      price: product.price,
      image: product.image_url
    };
    
    if (isInWishlist(parseInt(product.product_id?.toString() || product.id))) {
      removeFromWishlist(parseInt(product.product_id?.toString() || product.id));
    } else {
      addToWishlist(productData);
    }
  };
  
  const toggleGemPouch = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = featuredProducts.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: parseInt(product.product_id?.toString() || product.id),
      name: product.name,
      price: product.price,
      image: product.image_url
    };
    
    if (isInPouch(parseInt(product.product_id?.toString() || product.id))) {
      removeItem(parseInt(product.product_id?.toString() || product.id));
    } else {
      addItem(productData);
    }
  };
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation logic for smooth infinite scroll (copied from Reviews)
  useEffect(() => {
    if (!isClient || featuredProducts.length <= 4 || !containerRef.current) return;
    
    let animationId: number;
    const startTime = performance.now();
    const container = containerRef.current;
    
    // Calculate dimensions for featured cards
    const cardWidth = window.innerWidth < 768 ? 
      (window.innerWidth * 0.5 + 16) : // Mobile: 50vw + margins
      window.innerWidth < 1024 ? 
        (window.innerWidth * 0.3333 + 24) : // Medium: 33.33vw + margins
        (window.innerWidth * 0.25 + 24); // Large: 25vw + margins
    const oneSetWidth = featuredProducts.length * cardWidth;
    
    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const speed = 45; // pixels per second - same as reviews
      const translateX = -(elapsed * speed);
      
      // Better normalization to prevent glitches
      let normalizedTranslateX = 0;
      if (oneSetWidth > 0) {
        const rawMod = translateX % oneSetWidth;
        normalizedTranslateX = rawMod <= -oneSetWidth ? rawMod + oneSetWidth : rawMod;
      }
      
      // Directly update the transform without causing React re-renders
      container.style.transform = `translate3d(${normalizedTranslateX}px, 0, 0)`;
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isClient, featuredProducts]);

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
                    <div key={product.id} className="flex-shrink-0 w-[280px]">
                      <div 
                        className="rounded-2xl p-2 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out cursor-pointer product-card select-none h-full flex flex-col"
                        style={{ backgroundColor: '#f0f0f0' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = product.product_id || product.id;
                          router.push(`/product/${targetId}`);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <div className="aspect-square bg-neutral-100 rounded-lg mb-2 overflow-hidden relative">
                          {product.price < product.original_price && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                              {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                            </div>
                          )}
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
                        <p className="text-neutral-600 text-xs leading-relaxed min-h-[2.5rem] md:block hidden flex-grow text-center">{product.description}</p>
                        <div className="mt-auto pt-2 flex items-center md:justify-between justify-center">
                          <button
                            onClick={(e) => toggleWishlist(product.id, e)}
                            className="text-black hover:text-yellow-400 transition-colors p-1 hidden md:block"
                          >
                            {isInWishlist(parseInt(product.product_id?.toString() || product.id)) ? (
                              <IconStarFilled className="h-6 w-6 text-yellow-400" />
                            ) : (
                              <IconStar className="h-6 w-6" />
                            )}
                          </button>
                          <div className="flex items-center gap-3 md:gap-2">
                            <button
                              onClick={(e) => toggleWishlist(product.id, e)}
                              className="text-black hover:text-yellow-400 transition-colors p-1 md:hidden"
                            >
                              {isInWishlist(parseInt(product.product_id?.toString() || product.id)) ? (
                                <IconStarFilled className="h-6 w-6 text-yellow-400" />
                              ) : (
                                <IconStar className="h-6 w-6" />
                              )}
                            </button>
                            <div className="flex items-center gap-2">
                              {product.price < product.original_price && (
                                <span className="text-sm text-black line-through">{formatPrice(product.original_price)}</span>
                              )}
                              <span className="text-lg font-bold text-black">{formatPrice(product.price)}</span>
                            </div>
                            <button
                              onClick={(e) => toggleGemPouch(product.id, e)}
                              className="text-black hover:text-neutral-600 transition-colors p-1 relative md:hidden"
                            >
                              <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                              {isInPouch(parseInt(product.product_id?.toString() || product.id)) && (
                                <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={(e) => toggleGemPouch(product.id, e)}
                            className="text-black hover:text-neutral-600 transition-colors p-1 relative hidden md:block"
                          >
                            <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                            {isInPouch(parseInt(product.product_id?.toString() || product.id)) && (
                              <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // Scrolling layout for more than 4 items
            return (
              <div className="overflow-hidden py-8">
                <div 
                  ref={containerRef}
                  className="flex"
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  {featuredProducts.concat(featuredProducts).concat(featuredProducts).map((product, index) => {
                    return (
                      <div key={`${product.id}-${index}`} className="inline-block flex-shrink-0 w-[calc(50vw-0.75rem)] md:w-[calc(33.33vw-1rem)] lg:w-[calc(25vw-1rem)] mx-2 md:mx-3">
                        <div 
                          className="rounded-2xl p-2 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out cursor-pointer product-card select-none h-full flex flex-col"
                          style={{ backgroundColor: '#f0f0f0' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = product.product_id || product.id;
                            router.push(`/product/${targetId}`);
                            window.scrollTo(0, 0);
                          }}
                        >
                          <div className="aspect-square bg-neutral-100 rounded-lg mb-2 overflow-hidden relative">
                            {product.price < product.original_price && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                              </div>
                            )}
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
                          <p className="text-neutral-600 text-xs leading-relaxed min-h-[2.5rem] md:block hidden flex-grow text-center">{product.description}</p>
                          <div className="mt-auto pt-2 flex items-center md:justify-between justify-center">
                            <button
                              onClick={(e) => toggleWishlist(product.id, e)}
                              className="text-black hover:text-yellow-400 transition-colors p-1 hidden md:block"
                            >
                              {isInWishlist(parseInt(product.product_id?.toString() || product.id)) ? (
                                <IconStarFilled className="h-6 w-6 text-yellow-400" />
                              ) : (
                                <IconStar className="h-6 w-6" />
                              )}
                            </button>
                            <div className="flex items-center gap-3 md:gap-2">
                              <button
                                onClick={(e) => toggleWishlist(product.id, e)}
                                className="text-black hover:text-yellow-400 transition-colors p-1 md:hidden"
                              >
                                {isInWishlist(parseInt(product.product_id?.toString() || product.id)) ? (
                                  <IconStarFilled className="h-6 w-6 text-yellow-400" />
                                ) : (
                                  <IconStar className="h-6 w-6" />
                                )}
                              </button>
                              <div className="flex items-center gap-2">
                                {product.price < product.original_price && (
                                  <span className="text-sm text-black line-through">{formatPrice(product.original_price)}</span>
                                )}
                                <span className="text-lg font-bold text-black">{formatPrice(product.price)}</span>
                              </div>
                              <button
                                onClick={(e) => toggleGemPouch(product.id, e)}
                                className="text-black hover:text-neutral-600 transition-colors p-1 relative md:hidden"
                              >
                                <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                                {isInPouch(parseInt(product.product_id?.toString() || product.id)) && (
                                  <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                                )}
                              </button>
                            </div>
                            <button
                              onClick={(e) => toggleGemPouch(product.id, e)}
                              className="text-black hover:text-neutral-600 transition-colors p-1 relative hidden md:block"
                            >
                              <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                              {isInPouch(parseInt(product.product_id?.toString() || product.id)) && (
                                <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                              )}
                            </button>
                          </div>
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
      
      <style jsx>{`
        @media (hover: hover) and (pointer: fine) {
          .product-card:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
          }
        }
        .product-card {
          will-change: transform;
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