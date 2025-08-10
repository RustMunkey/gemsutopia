'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check } from 'lucide-react';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useGemPouch } from '../contexts/GemPouchContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCMSContent } from '@/hooks/useCMSContent';
import { extractVibrantColor } from '@/utils/colorExtraction';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  images: string[];
  on_sale: boolean;
  featured: boolean;
  metadata: {
    card_color?: string;
    card_gradient_from?: string;
    card_gradient_to?: string;
    use_gradient?: boolean;
  };
}

export default function Featured() {
  const router = useRouter();
  const { addItem, removeItem, isInPouch } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { getContent } = useCMSContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [productColors, setProductColors] = useState<{ [key: number]: string }>({});
  const [isClient, setIsClient] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  
  // Use exact shop page product structure
  const shopProducts = [
    { id: 1, name: 'Alberta Sapphire', type: 'sapphire', price: 299, originalPrice: 399, image: '/images/Review1.jpg' },
    { id: 2, name: 'Canadian Peridot', type: 'peridot', price: 199, originalPrice: 249, image: '/images/Review2.jpg' },
    { id: 3, name: 'Ammolite Gem', type: 'ammolite', price: 459, originalPrice: 599, image: '/images/Review3.jpg' },
    { id: 4, name: 'Blue Jay Sapphire', type: 'sapphire', price: 349, originalPrice: 449, image: '/images/Review4.jpg' },
    { id: 5, name: 'Alberta Garnet', type: 'garnet', price: 179, originalPrice: 229, image: '/images/Review5.jpg' },
    { id: 6, name: 'Canadian Quartz', type: 'quartz', price: 129, originalPrice: 169, image: '/images/Review6.jpg' },
    { id: 7, name: 'Prairie Agate', type: 'agate', price: 89, originalPrice: 119, image: '/images/Review7.jpg' },
    { id: 8, name: 'Rocky Mountain Jasper', type: 'jasper', price: 99, originalPrice: 129, image: '/images/Review8.jpg' },
    { id: 9, name: 'Alberta Amethyst', type: 'amethyst', price: 219, originalPrice: 289, image: '/images/Review9.jpg' },
    { id: 10, name: 'Canadian Topaz', type: 'topaz', price: 259, originalPrice: 329, image: '/images/Review10.jpg' },
    { id: 11, name: 'Northern Opal', type: 'opal', price: 389, originalPrice: 519, image: '/images/Review12.jpg' },
    { id: 12, name: 'Foothills Tourmaline', type: 'tourmaline', price: 299, originalPrice: 399, image: '/images/Review13.jpg' },
    { id: 13, name: 'Prairie Moonstone', type: 'moonstone', price: 169, originalPrice: 219, image: '/images/Review14.jpg' },
    { id: 14, name: 'Canadian Labradorite', type: 'labradorite', price: 149, originalPrice: 199, image: '/images/8680a65c-0c82-4529-a8f2-a051344e565a.webp' },
    { id: 15, name: 'Alberta Citrine', type: 'citrine', price: 139, originalPrice: 179, image: '/images/c07009ff-cd86-45d0-858e-441993683280.webp' },
    { id: 16, name: 'Mountain Jade', type: 'jade', price: 229, originalPrice: 299, image: '/images/Review-5.jpg' }
  ];

  // Use shop products for scrolling
  const productsToShow = shopProducts;
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetchProducts();
    
    // Listen for product updates from dashboard
    const handleProductsUpdated = () => {
      fetchProducts();
    };
    
    window.addEventListener('products-updated', handleProductsUpdated);
    
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdated);
    };
  }, []);

  // Extract colors from product images (only on client side)
  useEffect(() => {
    if (!isClient) return;
    
    const extractColors = async () => {
      const colors: { [key: number]: string } = {};
      
      for (const product of productsToShow) {
        try {
          const color = await extractVibrantColor(product.image);
          colors[product.id] = color;
        } catch (error) {
          colors[product.id] = '#1f2937'; // fallback
        }
      }
      
      setProductColors(colors);
    };
    
    extractColors();
  }, [isClient]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: parseInt(productId),
      name: product.name,
      price: product.price,
      image: product.images[0] || ''
    };
    
    if (isInWishlist(parseInt(productId))) {
      removeFromWishlist(parseInt(productId));
    } else {
      addToWishlist(productData);
    }
  };
  
  const toggleGemPouch = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: parseInt(productId),
      name: product.name,
      price: product.price,
      image: product.images[0] || ''
    };
    
    if (isInPouch(parseInt(productId))) {
      removeItem(parseInt(productId));
    } else {
      addItem(productData);
    }
  };
  
  // Simple automatic infinite scroll animation
  useEffect(() => {
    if (!isClient) return;
    
    startTimeRef.current = Date.now(); // Set start time only on client
    
    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000; // Convert to seconds
      const speed = 80; // pixels per second - faster speed
      const newTranslateX = -(elapsed * speed);
      
      setTranslateX(newTranslateX);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isClient]);

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
  const oneSetWidth = productsToShow.length * cardWidth;
  const normalizedTranslateX = ((translateX % oneSetWidth) + oneSetWidth) % oneSetWidth - oneSetWidth;

  return (
    <section className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {getContent('featured', 'section_title') || 'Featured Gems'}
          </h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
            {getContent('featured', 'section_subtitle') || 'Discover our curated collection of premium gemstones'}
          </p>
        </div>
      </div>
        
      {/* Infinite Scrolling Cards - Full Width */}
      <div className="overflow-hidden py-4 -mx-4 sm:-mx-6 lg:-mx-8">
        <div 
          ref={scrollContainerRef}
          className="flex"
          style={{
            transform: `translateX(${normalizedTranslateX}px)`,
            willChange: 'transform',
            width: 'max-content'
          }}
        >
          {/* Triple the products for seamless infinite scroll */}
          {productsToShow.concat(productsToShow).concat(productsToShow).map((product, index) => {
            // Add unique key for infinite scroll duplicates
            const cardColor = isClient ? (productColors[product.id] || '#1f2937') : '#1f2937';
            const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            
            return (
              <div key={`${product.id}-${index}`} className="inline-block flex-shrink-0 w-[calc(50vw-0.75rem)] md:w-[calc(33.33vw-1rem)] lg:w-[calc(25vw-1rem)] mx-2 md:mx-3">
                <div 
                  className="rounded-2xl p-2 shadow-2xl shadow-black/60 translate-x-1 translate-y-1 transition-transform duration-200 ease-out cursor-pointer product-card select-none h-full flex flex-col"
                  style={{ backgroundColor: cardColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to product page and scroll to top
                    router.push(`/product/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Content */}
                  <div className="aspect-square bg-neutral-100 rounded-lg mb-2 overflow-hidden relative">
                    <Image 
                      src={product.image} 
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
                  <h3 className="text-xl font-semibold text-white mb-2 text-center min-h-[3.5rem] flex items-center justify-center">{product.name}</h3>
                  <p className="text-neutral-300 text-sm leading-relaxed min-h-[3rem] md:block hidden flex-grow text-center">Hand-mined {product.type} from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 768px) {
          .animate-\[scroll_15s_linear_infinite\] {
            animation: scroll 20s linear infinite;
          }
        }
        
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