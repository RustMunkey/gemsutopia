'use client';
import Image from 'next/image';
import { IconStar, IconStarFilled, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Auction {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  video_url?: string | null;
  featured_image_index?: number;
  starting_bid: number;
  current_bid: number;
  reserve_price: number | null;
  bid_count: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'pending' | 'cancelled';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface AuctionContentProps {
  auction: Auction;
}

export default function AuctionContent({ auction: initialAuction }: AuctionContentProps) {
  const { addItem, removeItem, items } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { productRefreshTrigger } = useInventory();
  const [auction, setAuction] = useState(initialAuction);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [, setViewCount] = useState(typeof auction.metadata?.view_count === 'number' ? auction.metadata.view_count : 0);
  const [wishlistCount, setWishlistCount] = useState(typeof auction.metadata?.wishlist_count === 'number' ? auction.metadata.wishlist_count : 0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Get actual quantity from gem pouch context
  const cartQuantity = items.filter(item => item.id === auction.id).length;

  // Helper to check if auction is available for bidding
  const isAuctionAvailable = () => {
    const now = new Date();
    const endTime = new Date(auction.end_time);
    return auction.is_active && auction.status === 'active' && endTime > now;
  };
  
  // Calculate current price (use current_bid as the display price for auctions)
  const currentPrice = auction.current_bid;
  const originalPrice = auction.starting_bid !== auction.current_bid ? auction.starting_bid : null;
  
  // Get the main auction image (use featured image index as default)
  const auctionImage = auction.images && auction.images.length > 0 
    ? auction.images[selectedImageIndex] || auction.images[0] 
    : '/images/placeholder.jpg';
  
  // Set the initial selected image to the first image (always the featured image)
  useEffect(() => {
    if (auction.images?.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [auction.images]);

  // Track auction view on component mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const response = await fetch(`/api/auctions/${auction.id}/view`, {
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
  }, [auction.id, auction.title, currentPrice]);

  // Get video URL from metadata or direct property
  const videoUrl = auction.video_url || (typeof auction.metadata?.video_url === 'string' ? auction.metadata.video_url : null);
  
  // Get all available media (images + video)
  const allMedia = [
    ...auction.images,
    ...(videoUrl ? ['video'] : [])
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
    document.body.style.overflow = 'hidden';
  };

  const closeZoomModal = () => {
    setShowZoomModal(false);
    document.body.style.overflow = 'unset';
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
  }, [allMedia.length, showZoomModal, goToPrevZoomImage, goToNextZoomImage, closeZoomModal, goToPrevImage, goToNextImage]);

  // Refresh auction data when status changes
  useEffect(() => {
    const refreshTrigger = productRefreshTrigger[auction.id];
    if (refreshTrigger && refreshTrigger > 0) {
      const fetchUpdatedAuction = async () => {
        try {
          const response = await fetch(`/api/auctions/${auction.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAuction(data.auction);
            }
          }
        } catch (error) {
          console.error('Error refreshing auction data:', error);
        }
      };
      fetchUpdatedAuction();
    }
  }, [productRefreshTrigger, auction.id]);

  // Cleanup effect to restore scrolling if component unmounts while modal is open
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const toggleWishlist = async () => {
    const auctionData = {
      id: auction.id,
      name: auction.title,
      price: currentPrice,
      image: auctionImage
    };
    
    const wasInWishlist = isInWishlist(auction.id);
    
    if (wasInWishlist) {
      removeFromWishlist(auction.id);
    } else {
      addToWishlist(auctionData);
    }

    try {
      const response = await fetch(`/api/auctions/${auction.id}/wishlist`, {
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
    if (cartQuantity < 1) { // Auctions are unique items
      const auctionData = {
        id: auction.id,
        name: auction.title,
        price: currentPrice,
        image: auctionImage,
        stock: 1 // Auctions always have stock of 1
      };
      
      addItem(auctionData);
    }
  };

  const handleDecreaseQuantity = () => {
    if (cartQuantity > 0) {
      removeItem(auction.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <div className="relative z-10">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex-grow relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-16 relative">
            {/* Desktop Wishlist Button - Top Right Corner */}
            <button
              onClick={() => {
                if (!isAuctionAvailable()) return;
                toggleWishlist();
              }}
              disabled={!isAuctionAvailable()}
              className={`hidden md:block absolute top-4 right-4 z-10 transition-colors p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg ${
                !isAuctionAvailable() 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-black hover:text-neutral-600'
              }`}
            >
              {isInWishlist(auction.id) ? (
                <IconStarFilled className="h-8 w-8 text-yellow-400" />
              ) : (
                <IconStar className="h-8 w-8" strokeWidth={2} />
              )}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* Auction Image Gallery */}
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
                    className={`w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative ${
                      !isAuctionAvailable() 
                        ? 'cursor-default' 
                        : selectedImageIndex >= auction.images.length && videoUrl 
                          ? 'cursor-default' 
                          : 'cursor-zoom-in'
                    }`}
                    onClick={() => {
                      if (!isAuctionAvailable()) return;
                      if (selectedImageIndex < auction.images.length) {
                        openZoomModal();
                      }
                    }}
                  >
                    {selectedImageIndex >= auction.images.length && videoUrl ? (
                      <video 
                        controls
                        autoPlay
                        muted
                        loop
                        className="w-full h-full object-cover"
                        preload="metadata"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <source src={videoUrl || ''} type="video/mp4" />
                        <source src={videoUrl || ''} type="video/webm" />
                        <source src={videoUrl || ''} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image 
                        src={auctionImage}
                        alt={auction.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    )}

                    {/* Sold Out Overlay */}
                    {!isAuctionAvailable() && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                        <span className="text-white font-bold text-4xl md:text-6xl tracking-wider">SOLD</span>
                      </div>
                    )}
                    
                    {/* Navigation Arrows (Desktop) */}
                    {allMedia.length > 1 && isAuctionAvailable() && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPrevImage();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center z-10"
                          aria-label="Previous image"
                        >
                          <IconChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center z-10"
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
                    {auction.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!isAuctionAvailable()) return;
                          setSelectedImageIndex(index);
                          if (showZoomModal) {
                            setZoomImageIndex(index);
                          }
                        }}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors relative ${
                          selectedImageIndex === index
                            ? 'border-black'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${auction.title} ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                        {!isAuctionAvailable() && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                        )}
                      </button>
                    ))}
                    {videoUrl && (
                      <button
                        onClick={() => {
                          if (!isAuctionAvailable()) return;
                          setSelectedImageIndex(auction.images.length);
                          if (showZoomModal) {
                            setZoomImageIndex(auction.images.length);
                          }
                        }}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center bg-gray-100 relative ${
                          selectedImageIndex >= auction.images.length
                            ? 'border-black'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-600">VIDEO</div>
                        {!isAuctionAvailable() && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Auction Details */}
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 md:mb-6">{auction.title}</h1>
                <p className="text-base md:text-lg text-neutral-600 mb-6 md:mb-8 leading-relaxed">
                  {auction.description || 'Premium quality gemstone from Alberta, Canada. This exceptional gemstone features clarity and natural beauty, ethically sourced with care.'}
                </p>
                
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    {originalPrice && (
                      <span className="text-sm md:text-lg text-neutral-500 line-through">{formatPrice(originalPrice)}</span>
                    )}
                    <span className="text-2xl md:text-3xl font-bold text-black">{formatPrice(currentPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-lg text-neutral-700">
                      <span className="font-semibold">1</span> available (auction)
                    </span>
                    <div className="text-sm md:text-lg text-neutral-500">
                      {wishlistCount > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <span><span className="font-semibold">{wishlistCount}</span> watching</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div className={`w-full py-3 md:py-4 px-6 md:px-8 rounded-full font-semibold text-base md:text-lg flex items-center justify-between min-h-[52px] md:min-h-[60px] ${
                    !isAuctionAvailable() 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-black text-white'
                  }`}>
                    <button
                      type="button"
                      onClick={handleDecreaseQuantity}
                      disabled={!isAuctionAvailable()}
                      className={`hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center ${
                        cartQuantity === 0 || !isAuctionAvailable() ? 'invisible' : ''
                      }`}
                    >
                      -
                    </button>
                    <button
                      onClick={handleIncreaseQuantity}
                      disabled={cartQuantity >= 1 || !isAuctionAvailable()}
                      className="flex-1 flex items-center justify-center disabled:cursor-not-allowed"
                    >
                      {!isAuctionAvailable() ? 'SOLD' : (cartQuantity > 0 ? `Place Bid (${cartQuantity})` : 'Place Bid')}
                    </button>
                    <button
                      type="button"
                      onClick={handleIncreaseQuantity}
                      disabled={cartQuantity >= 1 || !isAuctionAvailable()}
                      className={`text-xl font-bold w-8 h-8 flex items-center justify-center ${
                        cartQuantity === 0 || !isAuctionAvailable() ? 'invisible' : ''
                      } ${cartQuantity >= 1 || !isAuctionAvailable() ? 'opacity-30' : 'hover:text-gray-300'}`}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      if (!isAuctionAvailable()) return;
                      if (cartQuantity === 0) {
                        handleIncreaseQuantity();
                      }
                      window.location.href = '/checkout';
                    }}
                    disabled={!isAuctionAvailable()}
                    className={`w-full border-2 py-3 md:py-4 px-6 md:px-8 rounded-full font-semibold text-base md:text-lg transition-colors ${
                      !isAuctionAvailable() 
                        ? 'border-gray-400 text-gray-600 bg-gray-100 cursor-not-allowed' 
                        : 'border-black text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {!isAuctionAvailable() ? 'SOLD' : 'Buy Now'}
                  </button>
                  
                  {/* Mobile Wishlist - Simple link style */}
                  <button
                    onClick={() => {
                      if (!isAuctionAvailable()) return;
                      toggleWishlist();
                    }}
                    disabled={!isAuctionAvailable()}
                    className={`md:hidden transition-colors flex items-center justify-center gap-2 py-2 ${
                      !isAuctionAvailable() 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-black hover:text-neutral-600'
                    }`}
                  >
                    {isInWishlist(auction.id) ? (
                      <>
                        <IconStarFilled className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm">Remove from Wishlist</span>
                      </>
                    ) : (
                      <>
                        <IconStar className="h-5 w-5" strokeWidth={2} />
                        <span className="text-sm">Add to Wishlist</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-8 md:mt-12 space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-black mb-2">Details</h3>
                    <ul className="text-sm md:text-base text-neutral-600 space-y-1">
                      {(Array.isArray(auction.metadata?.details) ? auction.metadata.details : [
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
                      {typeof auction.metadata?.shipping_info === 'string' ? auction.metadata.shipping_info : 'Free worldwide shipping. Delivery in 3-5 business days.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
              {zoomImageIndex >= auction.images.length && videoUrl ? (
                <video 
                  controls
                  autoPlay
                  muted
                  loop
                  className="max-w-full max-h-full object-contain"
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src={videoUrl || ''} type="video/mp4" />
                  <source src={videoUrl || ''} type="video/webm" />
                  <source src={videoUrl || ''} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image 
                  src={auction.images[zoomImageIndex] || auction.images[0]}
                  alt={`${auction.title} zoom view`}
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
                {auction.images.map((image, index) => (
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
                      alt={`${auction.title} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {videoUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomImageIndex(auction.images.length);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center bg-gray-700 ${
                      zoomImageIndex >= auction.images.length
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

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}