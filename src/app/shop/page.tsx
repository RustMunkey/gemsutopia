'use client';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IconStar, IconStarFilled, IconFilter } from '@tabler/icons-react';
import { ShoppingBag, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { extractVibrantColor } from '@/utils/colorExtraction';

export default function Shop() {
  const router = useRouter();
  const { addItem, removeItem, isInPouch } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const [sortBy, setSortBy] = useState('default');
  const [priceFilter, setPriceFilter] = useState('all');
  const [gemType, setGemType] = useState('all');
  const [productColors, setProductColors] = useState<{ [key: number]: string }>({});
  const [isClient, setIsClient] = useState(false);
  
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
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  const products = useMemo(() => [
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
  ], []);

  // Extract colors from product images (only on client side)
  useEffect(() => {
    if (!isClient) return;
    
    const extractColors = async () => {
      const colors: { [key: number]: string } = {};
      
      for (const product of products) {
        try {
          const color = await extractVibrantColor(product.image);
          colors[product.id] = color;
        } catch {
          colors[product.id] = '#1f2937'; // fallback
        }
      }
      
      setProductColors(colors);
    };
    
    extractColors();
  }, [isClient, products]);

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
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <Header />
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Gem Collection</h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Explore our curated selection of authentic Canadian gemstones, personally mined and carefully chosen by Reese from the pristine landscapes of Alberta
            </p>
          </div>

          {/* Filters and Sorting */}
          <div className="bg-white/70 rounded-lg p-4 mb-8 shadow-md">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <div className="flex items-center gap-2 text-black mb-4">
                <IconFilter className="h-5 w-5" />
                <span className="font-semibold">Filter & Sort</span>
              </div>
              
              <div className="space-y-3">
                {/* Sort By */}
                <div>
                  <label htmlFor="sort" className="block text-sm font-medium text-black mb-1">Sort by:</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
                  >
                    <option value="default">Default</option>
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-black mb-1">Price:</label>
                  <select
                    id="price"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
                  >
                    <option value="all">All Prices</option>
                    <option value="under200">Under $200</option>
                    <option value="200to300">$200 - $300</option>
                    <option value="over300">Over $300</option>
                  </select>
                </div>

                {/* Gem Type Filter */}
                <div>
                  <label htmlFor="gemType" className="block text-sm font-medium text-black mb-1">Type:</label>
                  <select
                    id="gemType"
                    value={gemType}
                    onChange={(e) => setGemType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
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

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-black">
                <IconFilter className="h-5 w-5" />
                <span className="font-semibold">Filter & Sort:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-desktop" className="text-sm font-medium text-black">Sort by:</label>
                  <select
                    id="sort-desktop"
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
                  <label htmlFor="price-desktop" className="text-sm font-medium text-black">Price:</label>
                  <select
                    id="price-desktop"
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
                  <label htmlFor="gemType-desktop" className="text-sm font-medium text-black">Type:</label>
                  <select
                    id="gemType-desktop"
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
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              const cardColor = isClient ? (productColors[product.id] || '#1f2937') : '#1f2937';
              return (
                <div 
                  key={product.id} 
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
                  <h3 className="text-xl font-semibold text-white mb-2 text-center min-h-[3.5rem] flex items-center justify-center">{product.name}</h3>
                  <p className="text-neutral-300 text-sm leading-relaxed min-h-[3rem] md:block hidden flex-grow">Hand-mined {product.type} from Alberta, Canada. This premium quality gemstone features exceptional clarity and natural beauty, ethically sourced with care.</p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white line-through">${product.originalPrice}</span>
                        <span className="text-lg font-bold text-white">${product.price}</span>
                      </div>
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