'use client';
import Image from 'next/image';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInventory } from '@/contexts/InventoryContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  on_sale: boolean;
  category: string;
  images: string[];
  tags: string[];
  inventory: number;
  sku: string;
  weight?: number;
  dimensions?: any;
  is_active: boolean;
  featured: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface ProductContentProps {
  product: Product;
}

export default function ProductContent({ product: initialProduct }: ProductContentProps) {
  const { addItem, removeItem, items } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { productRefreshTrigger } = useInventory();
  const [product, setProduct] = useState(initialProduct);
  // Get actual quantity from gem pouch context
  const cartQuantity = items.filter(item => item.id === product.id).length;
  
  // Get the main product image
  const productImage = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';
  
  // Calculate current price (sale price if on sale, otherwise regular price)
  const currentPrice = product.on_sale && product.sale_price ? product.sale_price : product.price;
  const originalPrice = product.on_sale && product.sale_price ? product.price : null;

  // Refresh product data when inventory changes
  useEffect(() => {
    const refreshTrigger = productRefreshTrigger[product.id];
    if (refreshTrigger && refreshTrigger > 0) {
      const fetchUpdatedProduct = async () => {
        try {
          const response = await fetch(`/api/products/${product.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setProduct(data.product);
            }
          }
        } catch (error) {
          console.error('Error refreshing product data:', error);
        }
      };
      fetchUpdatedProduct();
    }
  }, [productRefreshTrigger, product.id]);


  const toggleWishlist = () => {
    const productData = {
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: productImage
    };
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(productData);
    }
  };

  const handleIncreaseQuantity = () => {
    if (cartQuantity < product.inventory) {
      const productData = {
        id: product.id,
        name: product.name,
        price: currentPrice,
        image: productImage
      };
      
      addItem(productData);
    }
  };

  const handleDecreaseQuantity = () => {
    if (cartQuantity > 0) {
      removeItem(product.id);
    }
  };

  return (
    <div className="flex-grow py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Product Image */}
          <div 
            className="w-full aspect-square rounded-2xl p-4 md:p-6 relative"
            style={{ backgroundColor: '#f0f0f0' }}
          >
            <div className="w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative">
              <Image 
                src={productImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black">{product.name}</h1>
              <button
                onClick={toggleWishlist}
                className="text-black hover:text-neutral-600 transition-colors p-2"
              >
                {isInWishlist(product.id) ? (
                  <IconStarFilled className="h-8 w-8 text-yellow-400" />
                ) : (
                  <IconStar className="h-8 w-8" strokeWidth={2} />
                )}
              </button>
            </div>
            <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-8 leading-relaxed">
              {product.description || 'Premium quality gemstone from Alberta, Canada. This exceptional gemstone features clarity and natural beauty, ethically sourced with care.'}
            </p>
            
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-4 mb-2">
                {originalPrice && (
                  <span className="text-sm md:text-lg text-neutral-500 line-through">{formatPrice(originalPrice)}</span>
                )}
                <span className="text-2xl md:text-3xl font-bold text-black">{formatPrice(currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-lg text-neutral-500">Free shipping</span>
                <span className="text-sm md:text-base text-neutral-700">
                  <span className="font-semibold">{product.inventory}</span> in stock
                </span>
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <div className="w-full bg-black text-white py-3 md:py-4 px-6 md:px-8 rounded-full font-semibold text-base md:text-lg flex items-center justify-between min-h-[52px] md:min-h-[60px]">
                <button
                  type="button"
                  onClick={handleDecreaseQuantity}
                  className={`text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center ${cartQuantity === 0 ? 'invisible' : ''}`}
                >
                  -
                </button>
                <button 
                  onClick={handleIncreaseQuantity}
                  disabled={cartQuantity >= product.inventory}
                  className="flex-1 flex items-center justify-center disabled:cursor-not-allowed"
                >
                  {cartQuantity > 0 ? `Add to Cart (${cartQuantity})` : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={handleIncreaseQuantity}
                  disabled={cartQuantity >= product.inventory}
                  className={`text-white text-xl font-bold w-8 h-8 flex items-center justify-center ${cartQuantity === 0 ? 'invisible' : ''} ${cartQuantity >= product.inventory ? 'opacity-30' : 'hover:text-gray-300'}`}
                >
                  +
                </button>
              </div>
              <button 
                onClick={() => {
                  if (cartQuantity === 0) {
                    handleIncreaseQuantity(); // Add to cart first if nothing is in cart
                  }
                  // Then navigate to checkout
                  window.location.href = '/checkout';
                }}
                className="w-full border-2 border-black text-black py-3 md:py-4 px-6 md:px-8 rounded-full font-semibold text-base md:text-lg hover:bg-black hover:text-white transition-colors"
              >
                Buy Now
              </button>
            </div>
            
            <div className="mt-8 md:mt-12 space-y-4 md:space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-black mb-2">Details</h3>
                <ul className="text-sm md:text-base text-neutral-600 space-y-1">
                  {(product.metadata?.details || [
                    'Premium quality gemstone',
                    'Authentically sourced',
                    'Lifetime guarantee',
                    'Certificate of authenticity included'
                  ]).map((detail: string, index: number) => (
                    <li key={index}>• {detail}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-base md:text-lg font-semibold text-black mb-2">Shipping</h3>
                <p className="text-sm md:text-base text-neutral-600">
                  {product.metadata?.shipping_info || 'Free worldwide shipping. Delivery in 3-5 business days.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}