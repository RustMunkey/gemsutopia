'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
}

// Category Card Component
function CategoryCard({ category, router }: { category: Category; router: any }) {
  return (
    <div 
      className="rounded-2xl p-4 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out cursor-pointer category-card select-none h-full flex flex-col group hover:translate-y-[-8px] hover:shadow-3xl"
      style={{ backgroundColor: '#f0f0f0' }}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/shop/${category.slug}`);
        window.scrollTo(0, 0);
      }}
    >
      {/* Category Image */}
      <div className="aspect-square bg-neutral-100 rounded-lg mb-4 overflow-hidden relative">
        {category.image_url ? (
          <Image 
            src={category.image_url} 
            alt={category.name}
            fill
            className="object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-200"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={80}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200">
            <Package className="h-12 w-12 text-neutral-400" />
          </div>
        )}
        
        {/* Product Count Badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
          {category.product_count} {category.product_count === 1 ? 'gem' : 'gems'}
        </div>

        {/* Gemsutopia Logo */}
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

      {/* Category Info */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-bold text-black mb-2 text-center leading-tight group-hover:text-neutral-700 transition-colors">
          {category.name}
        </h3>
        
        {category.description && (
          <p className="text-sm text-neutral-600 text-center mb-4 line-clamp-2 flex-1">
            {category.description}
          </p>
        )}

        {/* Explore Button */}
        <div className="mt-auto">
          <div className="flex items-center justify-center gap-2 text-black group-hover:text-neutral-700 transition-colors">
            <span className="font-medium">Explore Collection</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch categories with product counts
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Filter only active categories and add product counts
          const activeCategories = data.categories.filter((cat: Category) => cat.is_active);
          
          // Get product count for each category
          const categoriesWithCounts = await Promise.all(
            activeCategories.map(async (category: Category) => {
              try {
                const productsResponse = await fetch(`/api/categories/${category.id}/products`);
                if (productsResponse.ok) {
                  const productsData = await productsResponse.json();
                  return {
                    ...category,
                    product_count: productsData.products?.length || 0
                  };
                } else {
                  return {
                    ...category,
                    product_count: 0
                  };
                }
              } catch (error) {
                console.error(`Error fetching products for category ${category.name}:`, error);
                return {
                  ...category,
                  product_count: 0
                };
              }
            })
          );
          
          // Sort by sort_order then by name
          categoriesWithCounts.sort((a, b) => {
            if (a.sort_order !== b.sort_order) {
              return a.sort_order - b.sort_order;
            }
            return a.name.localeCompare(b.name);
          });
          
          setCategories(categoriesWithCounts);
        } else {
          setError(data.error || 'Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try again.');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
      
      {loading ? (
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
              <p className="font-semibold mb-2">Error Loading Categories</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Gem Categories</h1>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Explore our curated gemstone collections, each category featuring authentic Canadian gems personally mined and carefully chosen by Reese from the pristine landscapes of Alberta
              </p>
            </div>

            {/* Categories Grid */}
            {categories.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">No Categories Available</h3>
                <p className="text-neutral-600">
                  We're currently organizing our gemstone collections. Please check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} router={router} />
                ))}
              </div>
            )}

            {/* Summary */}
            {categories.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-neutral-600">
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'} • {categories.reduce((total, cat) => total + cat.product_count, 0)} total gems
                </p>
              </div>
            )}
          </div>
      </div>
      )}
      
      <div className="relative z-10">
        <Footer />
      </div>
      
      <style jsx>{`
        @media (hover: hover) and (pointer: fine) {
          .category-card:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
          }
        }
        .category-card {
          will-change: transform;
        }
        .category-card {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        .category-card img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}