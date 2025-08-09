'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { useGemPouch } from '../contexts/GemPouchContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCMSContent } from '@/hooks/useCMSContent';

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
  const [loading, setLoading] = useState(true);
  
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
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
  
  // Add swipe detection
  useEffect(() => {
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diffY = Math.abs(currentY - startY);
      
      // If significant vertical movement detected, clear hover
      if (diffY > 10) {
        // Clear hover effects if needed
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
  
  return (
    <section className="relative z-10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            {getContent('featured', 'section_title') || 'Featured Finds'}
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {getContent('featured', 'section_subtitle') || 'Discover our curated collection of premium gemstones'}
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-neutral-600">
            <p className="text-lg">No featured products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
                <div 
                  key={product.id} 
                  className="rounded-2xl p-6 shadow-2xl translate-x-1 translate-y-1 transition-transform duration-200 ease-out cursor-pointer product-card select-none"
                  style={product.metadata?.use_gradient 
                    ? { background: `linear-gradient(to right, ${product.metadata?.card_gradient_from || '#9333ea'}, ${product.metadata?.card_gradient_to || '#db2777'})` }
                    : { backgroundColor: product.metadata?.card_color || '#000000' }
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to product page and scroll to top
                    router.push(`/product/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Content */}
                  <div className="aspect-square bg-neutral-100 rounded-lg mb-4 overflow-hidden relative">
                    {product.on_sale && product.sale_price && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        {Math.round((1 - product.sale_price / product.price) * 100)}% OFF
                      </div>
                    )}
                    <Image 
                      src={product.images[0] || '/images/placeholder.jpg'} 
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="text-white hover:text-yellow-400 transition-colors p-1"
                    >
                      {isInWishlist(parseInt(product.id)) ? (
                        <Star fill="currentColor" className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <Star className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed min-h-[3rem]">{product.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.on_sale && product.sale_price && (
                        <span className="text-sm text-neutral-400 line-through">${product.price}</span>
                      )}
                      <span className="text-lg font-bold text-white">${product.on_sale && product.sale_price ? product.sale_price : product.price}</span>
                    </div>
                    <button
                      onClick={(e) => toggleGemPouch(product.id, e)}
                      className="text-white hover:text-neutral-300 transition-colors p-1 relative"
                    >
                      <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                      {isInPouch(parseInt(product.id)) && (
                        <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                      )}
                    </button>
                  </div>
                </div>
            ))}
          </div>
        )}
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