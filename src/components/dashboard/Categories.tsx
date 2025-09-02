'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Search, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import SingleImageUpload from './SingleImageUpload';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-neutral-400 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Sort */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-white"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('sort_order')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
              sortBy === 'sort_order' ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            Order
          </button>
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
              sortBy === 'name' ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            Name
          </button>
          <button
            onClick={() => handleSort('created_at')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
              sortBy === 'created_at' ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            Date
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-neutral-900 rounded-lg overflow-hidden">
        {filteredAndSortedCategories.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Categories Found</h3>
            <p className="text-neutral-400 mb-4">
              {searchTerm ? 'No categories match your search.' : 'Create your first category to organize products.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredAndSortedCategories.map((category) => (
              <div key={category.id} className="hover:bg-neutral-800/50 transition-colors">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Category Image */}
                    <div className="w-16 h-16 bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-neutral-500" />
                      )}
                    </div>

                    {/* Category Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCategoryExpansion(category)}
                          className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          )}
                          <h3 className="text-white font-semibold">{category.name}</h3>
                        </button>
                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                          {categoryProductCounts[category.id] || 0} {(categoryProductCounts[category.id] || 0) === 1 ? 'product' : 'products'}
                        </span>
                        <span className="text-xs text-neutral-500">#{category.sort_order}</span>
                        {!category.is_active && (
                          <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400 mt-1">
                        Slug: <span className="font-mono">/shop/{category.slug}</span>
                      </p>
                      {category.description && (
                        <p className="text-sm text-neutral-400 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1">
                        Created: {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openProductModal(category)}
                        className="p-2 bg-blue-900/50 text-blue-300 rounded-lg hover:bg-blue-900/70 hover:text-blue-200 transition-colors"
                        title="Add/remove products in this category"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleCategoryStatus(category)}
                        className={`p-2 rounded-lg transition-colors ${
                          category.is_active 
                            ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' 
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                        title={category.is_active ? 'Deactivate category' : 'Activate category'}
                      >
                        {category.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 bg-neutral-800 text-neutral-400 rounded-lg hover:bg-neutral-700 hover:text-white transition-colors"
                        title="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 bg-neutral-800 text-neutral-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Products View */}
                {expandedCategories.has(category.id) && (
                  <div className="px-4 pb-4 border-t border-neutral-700/50">
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-neutral-300 mb-3">
                        Products in this category:
                      </h4>
                      {categoryProductsCache[category.id] ? (
                        categoryProductsCache[category.id].length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                            {categoryProductsCache[category.id].map((product) => (
                              <div key={product.id} className="flex items-center gap-3 p-2 bg-neutral-800/50 rounded-lg">
                                {/* Product Image */}
                                <div className="w-12 h-12 bg-neutral-700 rounded-lg overflow-hidden flex-shrink-0">
                                  {product.images && product.images.length > 0 ? (
                                    <img 
                                      src={product.images[product.metadata?.featured_image_index || 0]} 
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-600">
                                      <Package className="h-6 w-6 text-neutral-400" />
                                    </div>
                                  )}
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-medium truncate text-sm">{product.name}</h5>
                                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                                    <span>Stock: {product.inventory || 0}</span>
                                    <span>${product.price}</span>
                                    {!product.is_active && (
                                      <span className="text-red-400">Inactive</span>
                                    )}
                                  </div>
                                </div>

                                {/* Remove from category button */}
                                <button
                                  onClick={async () => {
                                    // Remove this product from the current category
                                    try {
                                      const currentCategoriesResponse = await fetch(`/api/products/${product.id}/categories`);
                                      let currentCategoryIds: string[] = [];
                                      
                                      if (currentCategoriesResponse.ok) {
                                        const currentCategoriesData = await currentCategoriesResponse.json();
                                        currentCategoryIds = currentCategoriesData.categories?.map((cat: any) => cat.id) || [];
                                      }
                                      
                                      const newCategoryIds = currentCategoryIds.filter(id => id !== category.id);
                                      
                                      const response = await fetch(`/api/products/${product.id}/categories`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          category_ids: newCategoryIds
                                        }),
                                      });

                                      if (response.ok) {
                                        // Update the category product count
                                        setCategoryProductCounts(prev => ({
                                          ...prev,
                                          [category.id]: (prev[category.id] || 1) - 1
                                        }));
                                        
                                        // Update the cache
                                        setCategoryProductsCache(prev => ({
                                          ...prev,
                                          [category.id]: prev[category.id]?.filter(p => p.id !== product.id) || []
                                        }));
                                      }
                                    } catch (error) {
                                      console.error('Error removing product from category:', error);
                                    }
                                  }}
                                  className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Remove from this category"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500 italic">No products in this category yet.</p>
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                          <span className="text-sm text-neutral-400">Loading products...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-md">
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
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-white"
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
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-white"
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
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-white"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
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
          <div className="bg-neutral-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Products */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-white"
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
                        <div key={product.id} className="flex items-center gap-4 p-3 bg-neutral-800 rounded-lg">
                          {/* Product Image */}
                          <div className="w-12 h-12 bg-neutral-700 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[product.metadata?.featured_image_index || 0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-600">
                                <Package className="h-6 w-6 text-neutral-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{product.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-neutral-400">
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
                            <span className="text-sm text-neutral-400">
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
            <div className="mt-4 pt-4 border-t border-neutral-700 flex justify-between items-center">
              <p className="text-sm text-neutral-400">
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
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}