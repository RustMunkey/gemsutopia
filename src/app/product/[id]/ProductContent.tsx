'use client';
import Image from 'next/image';
import { IconStar, IconStarFilled, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInventory } from '@/contexts/InventoryContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  on_sale: boolean;
  category: string;
  images: string[];
  video_url?: string | null;
  featured_image_index?: number;
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [viewCount, setViewCount] = useState(product.metadata?.view_count || 0);
  const [wishlistCount, setWishlistCount] = useState(product.metadata?.wishlist_count || 0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Get actual quantity from gem pouch context
  const cartQuantity = items.filter(item => item.id === product.id).length;
  
  // Get the main product image (use featured image index as default)
  const productImage = product.images && product.images.length > 0 
    ? product.images[selectedImageIndex] || product.images[0] 
    : '/images/placeholder.jpg';
  
  // Set the initial selected image to the featured image
  useEffect(() => {
    if (product.featured_image_index !== undefined && product.images?.length > product.featured_image_index) {
      setSelectedImageIndex(product.featured_image_index);
    }
  }, [product.featured_image_index, product.images]);

  // Track product view on component mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const response = await fetch(`/api/products/${product.id}/view`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setViewCount(data.view_count);
          }
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [product.id]);

  // Get all available media (images + video)
  const allMedia = [
    ...product.images,
    ...(product.video_url ? ['video'] : [])
  ];

  // Navigation functions
  const goToNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allMedia.length);
  };

  const goToPrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  // Zoom modal navigation functions
  const goToNextZoomImage = () => {
    setZoomImageIndex((prev) => (prev + 1) % allMedia.length);
  };

  const goToPrevZoomImage = () => {
    setZoomImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const openZoomModal = () => {
    setZoomImageIndex(selectedImageIndex);
    setShowZoomModal(true);
  };

  const openZoomModalAtIndex = (index: number) => {
    setZoomImageIndex(index);
    setShowZoomModal(true);
  };

  const closeZoomModal = () => {
    setShowZoomModal(false);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && allMedia.length > 1) {
      goToNextImage();
    }
    if (isRightSwipe && allMedia.length > 1) {
      goToPrevImage();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (allMedia.length <= 1) return;
      
      if (showZoomModal) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevZoomImage();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNextZoomImage();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeZoomModal();
        }
      } else {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevImage();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allMedia.length, showZoomModal]);
  
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


  const toggleWishlist = async () => {
    const productData = {
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: productImage
    };
    
    const wasInWishlist = isInWishlist(product.id);
    
    if (wasInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(productData);
    }

    // Track wishlist count change
    try {
      const response = await fetch(`/api/products/${product.id}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: wasInWishlist ? 'remove' : 'add'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWishlistCount(data.wishlist_count);
        }
      }
    } catch (error) {
      console.error('Error tracking wishlist:', error);
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
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image/Video Display */}
            <div 
              ref={imageContainerRef}
              className="w-full aspect-square rounded-2xl p-4 md:p-6 relative group"
              style={{ backgroundColor: '#f0f0f0' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative cursor-zoom-in"
                onClick={openZoomModal}
                style={{ cursor: 'zoom-in' }}
              >
                {selectedImageIndex >= product.images.length && product.video_url ? (
                  <video 
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  >
                    <source src={product.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Image 
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}
                
                {/* Navigation Arrows (Desktop) */}
                {allMedia.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <IconChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <IconChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {allMedia.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {allMedia.length}
                  </div>
                )}
              </div>
            </div>
            
            {/* Thumbnails */}
            {allMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      if (showZoomModal) {
                        setZoomImageIndex(index);
                      }
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-black'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {product.video_url && (
                  <button
                    onClick={() => {
                      setSelectedImageIndex(product.images.length);
                      if (showZoomModal) {
                        setZoomImageIndex(product.images.length);
                      }
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center bg-gray-100 ${
                      selectedImageIndex >= product.images.length
                        ? 'border-black'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600">VIDEO</div>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black">{product.name}</h1>
              <div className="flex items-center gap-4">
                {wishlistCount > 0 && (
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    <span>{wishlistCount} watching</span>
                  </div>
                )}
                <button
                  onClick={toggleWishlist}
                  className="text-black hover:text-neutral-600 transition-colors p-2 relative"
                >
                  {isInWishlist(product.id) ? (
                    <IconStarFilled className="h-8 w-8 text-yellow-400" />
                  ) : (
                    <IconStar className="h-8 w-8" strokeWidth={2} />
                  )}
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </div>
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

      {/* Zoom Modal */}
      {showZoomModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeZoomModal}
        >
          <div className="relative w-full h-full max-w-7xl mx-auto p-4 flex flex-col">
            {/* Close button */}
            <button
              onClick={closeZoomModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              aria-label="Close zoom"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main zoom image */}
            <div className="flex-1 flex items-center justify-center relative">
              {zoomImageIndex >= product.images.length && product.video_url ? (
                <video 
                  controls
                  className="max-w-full max-h-full object-contain"
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src={product.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image 
                  src={product.images[zoomImageIndex] || product.images[0]}
                  alt={`${product.name} zoom view`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              {/* Navigation arrows */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevZoomImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200"
                    aria-label="Previous image"
                  >
                    <IconChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextZoomImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200"
                    aria-label="Next image"
                  >
                    <IconChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                  {zoomImageIndex + 1} / {allMedia.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allMedia.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      zoomImageIndex === index
                        ? 'border-white'
                        : 'border-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {product.video_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomImageIndex(product.images.length);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center bg-gray-700 ${
                      zoomImageIndex >= product.images.length
                        ? 'border-white'
                        : 'border-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-medium text-white">VIDEO</div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}