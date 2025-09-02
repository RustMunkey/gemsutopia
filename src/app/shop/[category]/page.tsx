'use client';
import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IconStar, IconStarFilled, IconFilter } from '@tabler/icons-react';
import { ShoppingBag, Check, Package, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useInventory } from '@/contexts/InventoryContext';

// Product interface
interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  featuredImageIndex: number;
  stock: number;
}

// Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}


export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addItem, removeItem, isInPouch } = useGemPouch();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice, formatPriceNoSuffix } = useCurrency();
  const { shopRefreshTrigger } = useInventory();
  
  const [sortBy, setSortBy] = useState('default');
  const [priceFilter, setPriceFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const categorySlug = resolvedParams.category;

  // Fetch category and products
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError('');

        // First, get the category by slug
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const categoriesData = await categoriesResponse.json();
        if (!categoriesData.success) {
          throw new Error(categoriesData.error || 'Failed to fetch categories');
        }

        const foundCategory = categoriesData.categories.find((cat: Category) => cat.slug === categorySlug);
        if (!foundCategory) {
          setError('Category not found');
          setLoading(false);
          return;
        }

        if (!foundCategory.is_active) {
          setError('This category is currently unavailable');
          setLoading(false);
          return;
        }

        setCategory(foundCategory);

        // Now fetch products for this category
        const productsResponse = await fetch(`/api/categories/${foundCategory.id}/products`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }

        const productsData = await productsResponse.json();
        if (!productsData.success) {
          throw new Error(productsData.error || 'Failed to fetch products');
        }

        // Transform products to match the expected interface
        const transformedProducts = (productsData.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          type: product.category,
          price: product.on_sale && product.sale_price ? product.sale_price : product.price,
          originalPrice: product.price,
          image: product.images?.[product.metadata?.featured_image_index || 0] || product.images?.[0] || '/images/placeholder.jpg',
          images: product.images || [],
          featuredImageIndex: product.metadata?.featured_image_index || 0,
          stock: product.stock || product.inventory || 0
        }));

        setProducts(transformedProducts);

      } catch (error) {
        console.error('Error fetching category data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categorySlug, shopRefreshTrigger]);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    };
    
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productData);
    }
  };
  
  const toggleGemPouch = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    };
    
    if (isInPouch(productId)) {
      removeItem(productId);
    } else {
      addItem(productData);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (priceFilter === 'under200' && product.price >= 200) return false;
      if (priceFilter === '200to300' && (product.price < 200 || product.price > 300)) return false;
      if (priceFilter === 'over300' && product.price <= 300) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col relative">
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
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading category...</p>
          </div>
        </div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col relative">
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
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
              <p className="font-semibold mb-2">Category Error</p>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={() => router.push('/shop')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Back to Shop
              </button>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

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
      
      <div className="relative z-10">
        <Header />
      </div>
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/shop')}
              className="flex items-center gap-2 text-black hover:text-neutral-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Categories</span>
            </button>
          </div>

          {/* Category Header */}
          {category && (
            <div className="text-center mb-12">
              {category.image_url && (
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-4">
                  {category.description}
                </p>
              )}
              <p className="text-sm text-neutral-500">
                {products.length} {products.length === 1 ? 'gem' : 'gems'} in this collection
              </p>
            </div>
          )}

          {/* Filters and Sorting */}
          {products.length > 0 && (
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
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} gems
              </div>
            </div>
          )}

          {/* Products Grid - Exact same as original shop page */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black mb-2">No Gems Available</h3>
              <p className="text-neutral-600 mb-6">
                {products.length === 0 
                  ? "This category doesn't have any gems yet. Check back soon!"
                  : "No gems match your current filters. Try adjusting your search criteria."
                }
              </p>
              <button
                onClick={() => router.push('/shop')}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Browse Other Categories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {filteredProducts.map((product) => {
                const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                return (
                  <div 
                    key={product.id} 
                    className={`rounded-2xl p-2 md:p-3 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out product-card select-none h-full flex flex-col ${
                      product.stock === 0 ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{ backgroundColor: '#f0f0f0' }}
                    onClick={(e) => {
                      if (product.stock === 0) return; // Don't navigate if sold out
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
                      
                      {/* Sold Out Overlay */}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="text-white font-bold text-3xl md:text-4xl tracking-wider">SOLD</span>
                        </div>
                      )}
                      
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
                    <h3 className="text-sm md:text-lg font-semibold text-black mb-1 text-center min-h-[2rem] md:min-h-[2.5rem] flex items-center justify-center leading-tight">{product.name}</h3>
                    <div className="mt-auto pt-2 md:pt-3 flex items-center md:justify-between justify-center">
                      <button
                        onClick={(e) => {
                          if (product.stock === 0) return; // Don't allow wishlist if sold out
                          toggleWishlist(product.id, e);
                        }}
                        disabled={product.stock === 0}
                        className={`transition-colors p-1 hidden md:block ${
                          product.stock === 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-black hover:text-yellow-400'
                        }`}
                      >
                        {isInWishlist(product.id) ? (
                          <IconStarFilled className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <IconStar className="h-6 w-6" />
                        )}
                      </button>
                      <div className="flex items-center gap-2 md:gap-2">
                        <button
                          onClick={(e) => {
                            if (product.stock === 0) return; // Don't allow wishlist if sold out
                            toggleWishlist(product.id, e);
                          }}
                          disabled={product.stock === 0}
                          className={`transition-colors p-0.5 md:hidden ${
                            product.stock === 0 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-black hover:text-yellow-400'
                          }`}
                        >
                          {isInWishlist(product.id) ? (
                            <IconStarFilled className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <IconStar className="h-5 w-5" />
                          )}
                        </button>
                        <div className="flex items-center gap-1 md:gap-2">
                          {product.price < product.originalPrice && (
                            <>
                              <span className="text-xs md:text-sm text-black line-through md:hidden">{formatPriceNoSuffix(product.originalPrice)}</span>
                              <span className="text-sm text-black line-through hidden md:inline">{formatPrice(product.originalPrice)}</span>
                            </>
                          )}
                          <span className="text-sm md:text-lg font-bold text-black md:hidden">{formatPriceNoSuffix(product.price)}</span>
                          <span className="text-lg font-bold text-black hidden md:inline">{formatPrice(product.price)}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            if (product.stock === 0) return; // Don't allow cart if sold out
                            toggleGemPouch(product.id, e);
                          }}
                          disabled={product.stock === 0}
                          className={`transition-colors p-0.5 relative md:hidden ${
                            product.stock === 0 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-black hover:text-neutral-600'
                          }`}
                        >
                          <ShoppingBag className="h-5 w-5" strokeWidth={2} />
                          {isInPouch(product.id) && (
                            <Check className="absolute bottom-0 right-0 h-3 w-3 text-green-500" strokeWidth={4} />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          if (product.stock === 0) return; // Don't allow cart if sold out
                          toggleGemPouch(product.id, e);
                        }}
                        disabled={product.stock === 0}
                        className={`transition-colors p-1 relative hidden md:block ${
                          product.stock === 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-black hover:text-neutral-600'
                        }`}
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
          )}
        </div>
      </div>
      
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