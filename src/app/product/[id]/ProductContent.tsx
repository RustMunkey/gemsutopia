'use client';
import Image from 'next/image';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { extractVibrantColor } from '@/utils/colorExtraction';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductContentProps {
  productId: number;
  productImage: string;
}

export default function ProductContent({ productId, productImage }: ProductContentProps) {
  const { addItem, removeItem, items } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const [productColor, setProductColor] = useState('#1f2937');
  const [isClient, setIsClient] = useState(false);
  
  // Get actual quantity from gem pouch context
  const cartQuantity = items.filter(item => item.id === productId).length;

  // Product data (matching shop page structure with stock)
  const products = [
    { id: 1, name: 'Alberta Sapphire', type: 'sapphire', price: 299, originalPrice: 399, image: '/images/Review1.jpg', stock: 8 },
    { id: 2, name: 'Canadian Peridot', type: 'peridot', price: 199, originalPrice: 249, image: '/images/Review2.jpg', stock: 12 },
    { id: 3, name: 'Ammolite Gem', type: 'ammolite', price: 459, originalPrice: 599, image: '/images/Review3.jpg', stock: 3 },
    { id: 4, name: 'Blue Jay Sapphire', type: 'sapphire', price: 349, originalPrice: 449, image: '/images/Review4.jpg', stock: 5 },
    { id: 5, name: 'Alberta Garnet', type: 'garnet', price: 179, originalPrice: 229, image: '/images/Review5.jpg', stock: 15 },
    { id: 6, name: 'Canadian Quartz', type: 'quartz', price: 129, originalPrice: 169, image: '/images/Review6.jpg', stock: 20 },
    { id: 7, name: 'Prairie Agate', type: 'agate', price: 89, originalPrice: 119, image: '/images/Review7.jpg', stock: 7 },
    { id: 8, name: 'Rocky Mountain Jasper', type: 'jasper', price: 99, originalPrice: 129, image: '/images/Review8.jpg', stock: 11 },
    { id: 9, name: 'Alberta Amethyst', type: 'amethyst', price: 219, originalPrice: 289, image: '/images/Review9.jpg', stock: 6 },
    { id: 10, name: 'Canadian Topaz', type: 'topaz', price: 259, originalPrice: 329, image: '/images/Review10.jpg', stock: 9 },
    { id: 11, name: 'Northern Opal', type: 'opal', price: 389, originalPrice: 519, image: '/images/Review12.jpg', stock: 4 },
    { id: 12, name: 'Foothills Tourmaline', type: 'tourmaline', price: 299, originalPrice: 399, image: '/images/Review13.jpg', stock: 13 },
    { id: 13, name: 'Prairie Moonstone', type: 'moonstone', price: 169, originalPrice: 219, image: '/images/Review14.jpg', stock: 10 },
    { id: 14, name: 'Canadian Labradorite', type: 'labradorite', price: 149, originalPrice: 199, image: '/images/8680a65c-0c82-4529-a8f2-a051344e565a.webp', stock: 14 },
    { id: 15, name: 'Alberta Citrine', type: 'citrine', price: 139, originalPrice: 179, image: '/images/c07009ff-cd86-45d0-858e-441993683280.webp', stock: 18 },
    { id: 16, name: 'Mountain Jade', type: 'jade', price: 229, originalPrice: 299, image: '/images/Review-5.jpg', stock: 2 }
  ];

  const product = products.find(p => p.id === productId) || products[0];
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Extract color from product image
  useEffect(() => {
    if (!isClient) return;
    
    const extractColor = async () => {
      try {
        const color = await extractVibrantColor(productImage);
        setProductColor(color);
      } catch {
        setProductColor('#1f2937'); // fallback
      }
    };
    
    extractColor();
  }, [isClient, productImage]);

  const toggleWishlist = () => {
    const productData = {
      id: productId,
      name: product.name,
      price: product.price,
      image: productImage
    };
    
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productData);
    }
  };

  const handleIncreaseQuantity = () => {
    if (cartQuantity < product.stock) {
      const productData = {
        id: productId,
        name: product.name,
        price: product.price,
        image: productImage
      };
      
      addItem(productData);
    }
  };

  const handleDecreaseQuantity = () => {
    if (cartQuantity > 0) {
      removeItem(productId);
    }
  };

  return (
    <div className="flex-grow py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Product Image */}
          <div 
            className="w-full aspect-square rounded-2xl p-4 md:p-6 relative"
            style={{ backgroundColor: isClient ? productColor : '#1f2937' }}
          >
            <div className="w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative">
              <Image 
                src={productImage}
                alt={`Product ${productId}`}
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
                {isInWishlist(productId) ? (
                  <IconStarFilled className="h-8 w-8 text-yellow-400" />
                ) : (
                  <IconStar className="h-8 w-8" strokeWidth={2} />
                )}
              </button>
            </div>
            <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-8 leading-relaxed">
              Hand-mined {product.type} from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.
            </p>
            
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm md:text-lg text-neutral-500 line-through">${product.originalPrice}</span>
                <span className="text-2xl md:text-3xl font-bold text-black">${product.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-lg text-neutral-500">Free shipping</span>
                <span className="text-sm md:text-base text-neutral-700">
                  <span className="font-semibold">{product.stock}</span> in stock
                </span>
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <div className="w-full bg-black text-white py-3 md:py-4 px-6 md:px-8 rounded-full font-semibold text-base md:text-lg flex items-center justify-between min-h-[52px] md:min-h-[60px]">
                <button 
                  onClick={handleDecreaseQuantity}
                  className={`text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center ${cartQuantity === 0 ? 'invisible' : ''}`}
                >
                  -
                </button>
                <div className="flex-1 flex items-center justify-center">
                  <button 
                    onClick={handleIncreaseQuantity}
                    disabled={cartQuantity >= product.stock}
                    className="text-center"
                  >
                    {cartQuantity > 0 ? `Add to Cart (${cartQuantity})` : 'Add to Cart'}
                  </button>
                </div>
                <button 
                  onClick={handleIncreaseQuantity}
                  disabled={cartQuantity >= product.stock}
                  className={`text-white hover:text-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-xl font-bold w-8 h-8 flex items-center justify-center ${cartQuantity === 0 ? 'invisible' : ''}`}
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
                  <li>• Premium quality gemstone</li>
                  <li>• Authentically sourced</li>
                  <li>• Lifetime guarantee</li>
                  <li>• Certificate of authenticity included</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-base md:text-lg font-semibold text-black mb-2">Shipping</h3>
                <p className="text-sm md:text-base text-neutral-600">Free worldwide shipping. Delivery in 3-5 business days.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}