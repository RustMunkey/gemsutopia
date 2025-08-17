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
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInventory } from '@/contexts/InventoryContext';

export default function Shop() {
  const router = useRouter();
  const { addItem, removeItem, isInPouch } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { shopRefreshTrigger } = useInventory();
  
  const [sortBy, setSortBy] = useState('default');
  const [priceFilter, setPriceFilter] = useState('all');
  const [gemType, setGemType] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  

  // Remove problematic touch event listeners that interfere with scrolling
  
  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        
        if (data.success) {
          // Transform database products to match current interface
          const transformedProducts = data.products.map((product: any) => ({
            id: product.id, // Keep UUID as string
            name: product.name,
            type: product.category,
            price: product.on_sale && product.sale_price ? product.sale_price : product.price,
            originalPrice: product.price,
            image: product.images?.[0] || '/images/placeholder.jpg',
            stock: product.inventory
          }));
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to empty array if database fails
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [shopRefreshTrigger]);


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
    <div className="min-h-[200vh] flex flex-col relative">
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
      
      <div className="relative z-10">
        <Header />
      </div>
      
      {loading ? (
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      ) : (
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
              return (
                <div 
                  key={product.id} 
                  className="rounded-2xl p-3 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out cursor-pointer product-card select-none h-full flex flex-col"
                  style={{ backgroundColor: '#f0f0f0' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to product page and scroll to top
                    router.push(`/product/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Content */}
                  <div className="aspect-square bg-neutral-100 rounded-lg mb-2 overflow-hidden relative">
                    {product.price < product.originalPrice && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        {discountPercent}% OFF
                      </div>
                    )}
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
                  <h3 className="text-lg font-semibold text-black mb-1 text-center min-h-[2.5rem] flex items-center justify-center leading-tight">{product.name}</h3>
                  <p className="text-neutral-600 text-xs leading-relaxed min-h-[2.5rem] md:block hidden flex-grow">Hand-mined {product.type} from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.</p>
                  <div className="mt-auto pt-3 flex items-center md:justify-between justify-center">
                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="text-black hover:text-yellow-400 transition-colors p-1 hidden md:block"
                    >
                      {isInWishlist(product.id) ? (
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
                        {isInWishlist(product.id) ? (
                          <IconStarFilled className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <IconStar className="h-6 w-6" />
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        {product.price < product.originalPrice && (
                          <span className="text-sm text-black line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                        <span className="text-lg font-bold text-black">{formatPrice(product.price)}</span>
                      </div>
                      <button
                        onClick={(e) => toggleGemPouch(product.id, e)}
                        className="text-black hover:text-neutral-600 transition-colors p-1 relative md:hidden"
                      >
                        <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                        {isInPouch(product.id) && (
                          <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={(e) => toggleGemPouch(product.id, e)}
                      className="text-black hover:text-neutral-600 transition-colors p-1 relative hidden md:block"
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
      )}
      
      <div className="relative z-10">
        <Footer />
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
    </div>
  );
}