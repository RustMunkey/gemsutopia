'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IconStar, IconStarFilled, IconFilter } from '@tabler/icons-react';
import { ShoppingBag, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';

export default function Shop() {
  const router = useRouter();
  const { addItem, removeItem, isInPouch } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const [sortBy, setSortBy] = useState('default');
  const [priceFilter, setPriceFilter] = useState('all');
  const [gemType, setGemType] = useState('all');
  
  const toggleWishlist = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    };
    
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productData);
    }
  };
  
  const toggleGemPouch = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    };
    
    if (isInPouch(productId)) {
      removeItem(productId);
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
  
  const products = [
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

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (priceFilter === 'under200' && product.price >= 200) return false;
      if (priceFilter === '200to300' && (product.price < 200 || product.price > 300)) return false;
      if (priceFilter === 'over300' && product.price <= 300) return false;
      if (gemType !== 'all' && product.type !== gemType) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return a.id - b.id;
      }
    });

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      
      <div 
        className="flex-grow py-16"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Gem Shop</h1>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Discover our complete collection of premium gemstones, hand-selected and ethically sourced from Alberta, Canada
              </p>
            </div>

            {/* Filters and Sorting */}
            <div className="bg-white/70 rounded-lg p-6 mb-8 shadow-md">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-black">
                <IconFilter className="h-5 w-5" />
                <span className="font-semibold">Filter & Sort:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm font-medium text-black">Sort by:</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black"
                  >
                    <option value="default">Default</option>
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Price Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="price" className="text-sm font-medium text-black">Price:</label>
                  <select
                    id="price"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black"
                  >
                    <option value="all">All Prices</option>
                    <option value="under200">Under $200</option>
                    <option value="200to300">$200 - $300</option>
                    <option value="over300">Over $300</option>
                  </select>
                </div>

                {/* Gem Type Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="gemType" className="text-sm font-medium text-black">Type:</label>
                  <select
                    id="gemType"
                    value={gemType}
                    onChange={(e) => setGemType(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black"
                  >
                    <option value="all">All Types</option>
                    <option value="sapphire">Sapphire</option>
                    <option value="peridot">Peridot</option>
                    <option value="ammolite">Ammolite</option>
                    <option value="garnet">Garnet</option>
                    <option value="quartz">Quartz</option>
                    <option value="agate">Agate</option>
                    <option value="jasper">Jasper</option>
                    <option value="amethyst">Amethyst</option>
                    <option value="topaz">Topaz</option>
                    <option value="opal">Opal</option>
                    <option value="tourmaline">Tourmaline</option>
                    <option value="moonstone">Moonstone</option>
                    <option value="labradorite">Labradorite</option>
                    <option value="citrine">Citrine</option>
                    <option value="jade">Jade</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} gems
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              return (
                <div 
                  key={product.id} 
                  className="bg-black rounded-2xl p-6 shadow-2xl shadow-black/60 translate-x-1 translate-y-1 transition-transform duration-200 ease-out cursor-pointer product-card select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to product page and scroll to top
                    router.push(`/product/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Content */}
                  <div className="aspect-square bg-neutral-100 rounded-lg mb-4 overflow-hidden relative">
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                      {discountPercent}% OFF
                    </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">{product.name}</h3>
                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="text-white hover:text-yellow-400 transition-colors p-1"
                    >
                      {isInWishlist(product.id) ? (
                        <IconStarFilled className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <IconStar className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed min-h-[3rem]">Hand-mined {product.type} from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400 line-through">${product.originalPrice}</span>
                      <span className="text-lg font-bold text-white">${product.price}</span>
                    </div>
                    <button
                      onClick={(e) => toggleGemPouch(product.id, e)}
                      className="text-white hover:text-neutral-300 transition-colors p-1 relative"
                    >
                      <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                      {isInPouch(product.id) && (
                        <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
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
    </div>
  );
}