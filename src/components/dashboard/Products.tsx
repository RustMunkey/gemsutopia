'use client';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Star,
  Package,
  Tag
} from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/lib/types/database';
import ImageUpload from './ImageUpload';
import { useMode } from '@/lib/contexts/ModeContext';

export default function Products() {
  const { mode } = useMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Listen for custom event to open add product modal
  useEffect(() => {
    const handleOpenAddModal = () => {
      setShowAddModal(true);
    };

    window.addEventListener('openAddProductModal', handleOpenAddModal);
    
    return () => {
      window.removeEventListener('openAddProductModal', handleOpenAddModal);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/products?includeInactive=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.is_active) ||
                         (filterStatus === 'inactive' && !product.is_active) ||
                         (filterStatus === 'featured' && product.featured) ||
                         (filterStatus === 'sale' && product.on_sale);
    
    console.log(`Product ${product.name}: search=${matchesSearch}, category=${matchesCategory}, status=${matchesStatus}, filterStatus=${filterStatus}, is_active=${product.is_active}`);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map(p => p.category))];

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    console.log('Toggling frontend visibility:', productId, 'from', currentStatus, 'to', !currentStatus);
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ frontend_visible: !currentStatus })
      });

      if (response.ok) {
        console.log('Product status updated successfully, refetching products...');
        await fetchProducts();
        console.log('Products refetched. Total products:', products.length);
      } else {
        console.error('Failed to update product status:', response.status);
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this product? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/products/${productId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Products ✨</h1>
            <p className="text-slate-400">Manage your product catalog</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-white/80 text-black px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              <Package className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`}>
              <Eye className="h-4 w-4" />
              <span className="ml-1">{mode === 'live' ? 'Live' : 'Dev'}</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{products.length}</p>
            <p className="text-slate-400 text-sm">Total Products</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
              <Eye className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`}>
              <Package className="h-4 w-4" />
              <span className="ml-1">Active</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{products.filter(p => p.is_active).length}</p>
            <p className="text-slate-400 text-sm">Active Products</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
              <Star className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`}>
              <Star className="h-4 w-4" />
              <span className="ml-1">Featured</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{products.filter(p => p.featured).length}</p>
            <p className="text-slate-400 text-sm">Featured Products</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${mode === 'dev' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : 'bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-red-500/20'}`}>
              <Tag className={`h-6 w-6 ${mode === 'dev' ? 'text-orange-400' : 'text-red-400'}`} />
            </div>
            <div className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-red-400'}`}>
              <Tag className="h-4 w-4" />
              <span className="ml-1">Sale</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">{products.filter(p => p.on_sale).length}</p>
            <p className="text-slate-400 text-sm">On Sale</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
            <option value="sale">On Sale</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-black rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-slate-400 font-medium">Product</th>
                <th className="text-left p-4 text-slate-400 font-medium">Category</th>
                <th className="text-left p-4 text-slate-400 font-medium">Price</th>
                <th className="text-left p-4 text-slate-400 font-medium">Stock</th>
                <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                <th className="text-left p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="h-12 w-12 text-slate-500" />
                      <p className="text-slate-400">No products found</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-white hover:text-white/80"
                      >
                        Add your first product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-sm text-slate-400">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{product.category}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          ${product.on_sale && product.sale_price ? product.sale_price : product.price}
                        </span>
                        {product.on_sale && product.sale_price && (
                          <span className="text-sm text-slate-400 line-through">${product.price}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1.5 rounded text-xs leading-relaxed ${
                        product.inventory > 10 
                          ? 'bg-white/20 text-white' 
                          : product.inventory > 0 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.inventory}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.is_active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.featured && (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                            Featured
                          </span>
                        )}
                        {product.on_sale && (
                          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                            Sale
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleProductStatus(product.id, product.metadata?.frontend_visible !== false)}
                          className="p-1 text-slate-400 hover:text-white"
                          title={(product.metadata?.frontend_visible !== false) ? 'Hide from frontend' : 'Show on frontend'}
                        >
                          {(product.metadata?.frontend_visible !== false) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete product"
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

      {/* Add/Edit Product Modal - We'll build this next */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            fetchProducts();
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({ product, onClose, onSave }: {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    sale_price: product?.sale_price?.toString() || '',
    on_sale: product?.on_sale || false,
    category: product?.category || '',
    inventory: product?.inventory?.toString() || '0',
    sku: product?.sku || '',
    weight: product?.weight?.toString() || '',
    is_active: true,
    featured: product?.featured || false,
    images: product?.images || [],
    video_url: product?.video_url || product?.metadata?.video_url || '', // Use direct column first, fallback to metadata
    featured_image_index: 0,
    tags: product?.tags?.join(', ') || '',
    // Product details
    details: (product?.metadata?.details || [
      'Premium quality gemstone',
      'Authentically sourced',
      'Lifetime guarantee',
      'Certificate of authenticity included'
    ]).join('\n'),
    // Shipping info
    shipping_info: product?.metadata?.shipping_info || 'Free worldwide shipping. Delivery in 3-5 business days.'
  });
  const [loading, setLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Fetch existing categories from products
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('admin-token');
        const response = await fetch('/api/products?includeInactive=true', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          const uniqueCategories = [...new Set(data.products.map((p: any) => p.category))].filter(Boolean) as string[];
          setAvailableCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setFormData(prev => ({ ...prev, category: customCategory }));
    } else {
      setFormData(prev => ({ ...prev, category: value }));
      setCustomCategory('');
    }
  };

  const handleCustomCategoryInput = (value: string) => {
    setCustomCategory(value);
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin-token');
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        inventory: parseInt(formData.inventory),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        images: formData.images,
        video_url: formData.video_url || null,
        featured_image_index: 0,
        metadata: {
          ...(product?.metadata || {}),
          details: formData.details.split('\n').map(item => item.trim()).filter(Boolean),
          shipping_info: formData.shipping_info
        }
      };
      
      console.log('Saving product with featured_image_index:', formData.featured_image_index);
      console.log('Form video_url:', formData.video_url);
      console.log('Product data video_url (direct column):', productData.video_url);
      console.log('Product data video_url (metadata legacy):', productData.metadata?.video_url);
      console.log('Full productData:', productData);

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSave();
      } else {
        alert(data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({...prev, sku: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              placeholder="Product description..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price * ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sale Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData(prev => ({...prev, sale_price: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Inventory
              </label>
              <input
                type="number"
                value={formData.inventory}
                onChange={(e) => setFormData(prev => ({...prev, inventory: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                placeholder="0"
              />
            </div>
          </div>

          {/* Category and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <div className="space-y-2">
                <select
                  value={availableCategories.includes(formData.category) ? formData.category : 'custom'}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white"
                  required
                >
                  <option value="" className="bg-slate-800">Select a category</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-800">
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                  <option value="custom" className="bg-slate-800">Create new category...</option>
                </select>
                
                {(!availableCategories.includes(formData.category) || availableCategories.length === 0) && (
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleCustomCategoryInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                    placeholder="Enter custom category name"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Weight (grams)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({...prev, weight: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                placeholder="0.000"
              />
            </div>
          </div>

          {/* Shipping */}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              placeholder="gold, handmade, vintage, etc."
            />
          </div>

          {/* Product Details */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Product Details (one per line)
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData(prev => ({...prev, details: e.target.value}))}
              rows={4}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              placeholder="Premium quality gemstone&#10;Authentically sourced&#10;Lifetime guarantee&#10;Certificate of authenticity included"
            />
            <p className="text-xs text-slate-400 mt-1">These will appear as bullet points on the product page</p>
          </div>

          {/* Shipping Information */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Shipping Information
            </label>
            <textarea
              value={formData.shipping_info}
              onChange={(e) => setFormData(prev => ({...prev, shipping_info: e.target.value}))}
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              placeholder="Free worldwide shipping. Delivery in 3-5 business days."
            />
            <p className="text-xs text-slate-400 mt-1">This will appear in the shipping section on the product page</p>
          </div>

          {/* Media Upload (Images + Video) */}
          <ImageUpload
            images={formData.images}
            video_url={formData.video_url || undefined}
            featured_image_index={formData.featured_image_index}
            onImagesChange={(images) => {
              setFormData(prev => ({...prev, images}));
              // Featured image is always the first image
              setFormData(prev => ({...prev, featured_image_index: 0}));
            }}
            onVideoChange={(videoUrl) => {
              console.log('Products: Video URL changed to:', videoUrl);
              setFormData(prev => ({...prev, video_url: videoUrl || ''}));
            }}
            onFeaturedImageChange={(index) => {
              console.log('Featured image changed to index:', index);
              setFormData(prev => ({...prev, featured_image_index: 0}));
            }}
            maxImages={8}
            folder="products"
            label="Product Media"
            description="Upload up to 8 images and 1 video (drag & drop or click to browse)"
          />

          {/* Status Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({...prev, featured: e.target.checked}))}
                className="rounded"
              />
              Featured Product
            </label>

            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.on_sale}
                onChange={(e) => setFormData(prev => ({...prev, on_sale: e.target.checked}))}
                className="rounded"
              />
              On Sale
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white hover:bg-white/80 disabled:bg-white/50 text-black rounded-lg font-medium"
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}