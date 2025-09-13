'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Search, ArrowUpDown, ChevronDown, ChevronRight, Grid, Star, Tag } from 'lucide-react';
import SingleImageUpload from './SingleImageUpload';
import { useMode } from '@/lib/contexts/ModeContext';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  inventory: number;
  is_active: boolean;
  metadata?: {
    featured_image_index?: number;
  };
}

export default function Categories() {
  const { mode } = useMode();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'sort_order'>('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Product assignment modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // Category expansion and product counts
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryProductCounts, setCategoryProductCounts] = useState<{[key: string]: number}>({});
  const [categoryProductsCache, setCategoryProductsCache] = useState<{[key: string]: Product[]}>({});

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories?include_inactive=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
        
        // Fetch product counts for each category
        const counts: {[key: string]: number} = {};
        await Promise.all(
          data.categories.map(async (category: Category) => {
            try {
              const productsResponse = await fetch(`/api/categories/${category.id}/products`);
              if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                counts[category.id] = productsData.products?.length || 0;
              } else {
                counts[category.id] = 0;
              }
            } catch (error) {
              console.error(`Error fetching products for category ${category.name}:`, error);
              counts[category.id] = 0;
            }
          })
        );
        setCategoryProductCounts(counts);
      } else {
        setError(data.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        handleCloseModal();
      } else {
        setError(data.error || 'Failed to save category');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will also remove it from all products.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error deleting category:', error);
    }
  };

  const openProductModal = async (category: Category) => {
    setSelectedCategory(category);
    setShowProductModal(true);
    setLoadingProducts(true);
    
    try {
      // Fetch all products
      const token = localStorage.getItem('admin-token');
      const productsResponse = await fetch('/api/products?includeInactive=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
      
      // Fetch products already in this category
      const categoryProductsResponse = await fetch(`/api/categories/${category.id}/products`);
      if (categoryProductsResponse.ok) {
        const categoryData = await categoryProductsResponse.json();
        setCategoryProducts(categoryData.products?.map((p: any) => p.id) || []);
      }
      
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleProductAssignment = async (productId: string) => {
    if (!selectedCategory) return;
    
    const isAssigned = categoryProducts.includes(productId);
    
    try {
      // First, get all current categories for this product
      const currentCategoriesResponse = await fetch(`/api/products/${productId}/categories`);
      let currentCategoryIds: string[] = [];
      
      if (currentCategoriesResponse.ok) {
        const currentCategoriesData = await currentCategoriesResponse.json();
        currentCategoryIds = currentCategoriesData.categories?.map((cat: any) => cat.id) || [];
      }
      
      // Calculate new category list for this product
      let newCategoryIds: string[];
      if (isAssigned) {
        // Remove the current category from this product
        newCategoryIds = currentCategoryIds.filter(id => id !== selectedCategory.id);
      } else {
        // Add the current category to this product (if not already there)
        newCategoryIds = currentCategoryIds.includes(selectedCategory.id) 
          ? currentCategoryIds 
          : [...currentCategoryIds, selectedCategory.id];
      }
      
      // Update the product's categories
      const response = await fetch(`/api/products/${productId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_ids: newCategoryIds
        }),
      });

      if (response.ok) {
        // Update the local state to reflect the change
        const newCategoryProducts = isAssigned 
          ? categoryProducts.filter(id => id !== productId)
          : [...categoryProducts, productId];
        setCategoryProducts(newCategoryProducts);
        
        // Update the category product count
        setCategoryProductCounts(prev => ({
          ...prev,
          [selectedCategory.id]: isAssigned ? (prev[selectedCategory.id] || 1) - 1 : (prev[selectedCategory.id] || 0) + 1
        }));
        
        // Clear the cache for this category so it refreshes when expanded
        setCategoryProductsCache(prev => {
          const newCache = { ...prev };
          delete newCache[selectedCategory.id];
          return newCache;
        });
      } else {
        const errorData = await response.json();
        console.error('Assignment error response:', errorData);
        setError(`Failed to update product assignment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling product assignment:', error);
      setError('Failed to update product assignment');
    }
  };

  const toggleCategoryExpansion = async (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    
    if (isExpanded) {
      // Collapse the category
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category.id);
        return newSet;
      });
    } else {
      // Expand the category - fetch products if not cached
      if (!categoryProductsCache[category.id]) {
        try {
          const response = await fetch(`/api/categories/${category.id}/products`);
          console.log('Fetch response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Fetch response data:', data);
            
            if (data.success) {
              setCategoryProductsCache(prev => ({
                ...prev,
                [category.id]: data.products || []
              }));
            } else {
              console.error('API returned success: false', data);
              setError(`Failed to load products for category: ${data.error || 'Unknown error'}`);
            }
          } else {
            console.error('HTTP error response:', response.status);
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response data:', errorData);
            setError(`HTTP ${response.status}: Failed to load category products`);
          }
        } catch (error) {
          console.error('Error fetching category products:', error);
          setError('Network error while loading category products');
        }
      }
      
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(category.id);
        return newSet;
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      sort_order: 0,
      is_active: true
    });
    setError('');
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...category,
          is_active: !category.is_active
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
      } else {
        setError(data.error || 'Failed to update category status');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error updating category status:', error);
    }
  };

  const filteredAndSortedCategories = categories
    .filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'sort_order':
          aValue = a.sort_order;
          bValue = b.sort_order;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (newSortBy: 'name' | 'created_at' | 'sort_order') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Categories 📂</h1>
            <p className="text-slate-400">Organize and manage product categories</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-white/80 text-black px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-purple-500/20'}`}>
              <Grid className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}`}>
              <Grid className="h-4 w-4" />
              <span className="ml-1">{mode === 'live' ? 'Live' : 'Dev'}</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{categories.length}</p>
            <p className="text-slate-400 text-sm">Total Categories</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
              <Eye className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`}>
              <Eye className="h-4 w-4" />
              <span className="ml-1">Active</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{categories.filter(c => c.is_active).length}</p>
            <p className="text-slate-400 text-sm">Active Categories</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              <Package className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`}>
              <Package className="h-4 w-4" />
              <span className="ml-1">Products</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{Object.values(categoryProductCounts).reduce((sum, count) => sum + count, 0)}</p>
            <p className="text-slate-400 text-sm">Total Products</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
              <Star className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`}>
              <Star className="h-4 w-4" />
              <span className="ml-1">Avg</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">
              {categories.length > 0 ? Math.round(Object.values(categoryProductCounts).reduce((sum, count) => sum + count, 0) / categories.length) : 0}
            </p>
            <p className="text-slate-400 text-sm">Avg Products/Category</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold mb-2">Error Loading Categories</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSort('sort_order')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                sortBy === 'sort_order' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
              Order
            </button>
            <button
              onClick={() => handleSort('name')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                sortBy === 'name' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
              Name
            </button>
            <button
              onClick={() => handleSort('created_at')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                sortBy === 'created_at' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ArrowUpDown className="h-3 w-3" />
              Date
            </button>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-black rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-slate-400 font-medium">Category</th>
                <th className="text-left p-4 text-slate-400 font-medium">Products</th>
                <th className="text-left p-4 text-slate-400 font-medium">Order</th>
                <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                <th className="text-left p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <Grid className="h-12 w-12 text-slate-500" />
                      <p className="text-slate-400">No categories found</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-white hover:text-white/80"
                      >
                        Add your first category
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedCategories.map((category) => (
                  <tr key={category.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {category.image_url ? (
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <Grid className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{category.name}</p>
                          <p className="text-sm text-slate-400">/shop/{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{categoryProductCounts[category.id] || 0}</span>
                        <button
                          onClick={() => toggleCategoryExpansion(category)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="View products in category"
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {expandedCategories.has(category.id) && categoryProductsCache[category.id] && (
                        <div className="mt-2 space-y-1">
                          {categoryProductsCache[category.id].slice(0, 3).map((product) => (
                            <div key={product.id} className="text-xs text-slate-400 truncate">
                              • {product.name}
                            </div>
                          ))}
                          {categoryProductsCache[category.id].length > 3 && (
                            <div className="text-xs text-slate-500">
                              +{categoryProductsCache[category.id].length - 3} more...
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1.5 rounded text-xs bg-white/20 text-white leading-relaxed">
                        #{category.sort_order}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          category.is_active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openProductModal(category)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Manage products"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Edit category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleCategoryStatus(category)}
                          className="p-1 text-slate-400 hover:text-white"
                          title={(category.is_active) ? 'Deactivate' : 'Activate'}
                        >
                          {category.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                  placeholder="e.g., BlueJay Sapphires"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                  placeholder="Category description..."
                  rows={3}
                />
              </div>

              <SingleImageUpload
                value={formData.image_url}
                onChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                folder="categories"
                label="Category Image"
                description="Upload an image to represent this category"
              />

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-800 text-white focus:ring-white"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-neutral-300">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white hover:bg-white/80 text-black rounded-lg font-medium"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Assignment Modal */}
      {showProductModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Manage Products in "{selectedCategory.name}"
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedCategory(null);
                  setProducts([]);
                  setCategoryProducts([]);
                  setProductSearchTerm('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Products */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-3">
                  {products
                    .filter(product => 
                      product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                    )
                    .map((product) => {
                      const isAssigned = categoryProducts.includes(product.id);
                      return (
                        <div key={product.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                          {/* Product Image */}
                          <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[product.metadata?.featured_image_index || 0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-600">
                                <Package className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{product.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>Stock: {product.inventory}</span>
                              <span>${product.price}</span>
                              {!product.is_active && (
                                <span className="text-red-400">Inactive</span>
                              )}
                            </div>
                          </div>

                          {/* Assignment Toggle */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => toggleProductAssignment(product.id)}
                              className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-400">
                              {isAssigned ? 'In Category' : 'Add to Category'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <p className="text-sm text-slate-400">
                {categoryProducts.length} products assigned to this category
              </p>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedCategory(null);
                  setProducts([]);
                  setCategoryProducts([]);
                  setProductSearchTerm('');
                }}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/80 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}