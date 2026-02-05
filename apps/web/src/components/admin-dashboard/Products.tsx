'use client';
import { useState, useEffect } from 'react';
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconStar,
  IconPackage,
  IconTag,
  IconLayoutGrid,
  IconGavel,
} from '@tabler/icons-react';
import Image from 'next/image';
import { Product } from '@/lib/types/database';
import ImageUpload from './ImageUpload';
import { useMode } from '@/lib/contexts/ModeContext';
import Categories from './Categories';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export default function Products() {
  const { mode } = useMode();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'auctions'>('products');
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
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      }
    } catch {
      // Error fetching products
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && product.is_active) ||
      (filterStatus === 'inactive' && !product.is_active) ||
      (filterStatus === 'featured' && product.featured) ||
      (filterStatus === 'sale' && product.on_sale);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(products.map(p => p.category))];

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ frontend_visible: !currentStatus }),
      });

      if (response.ok) {
        await fetchProducts();
        toast.success(currentStatus ? 'Product hidden' : 'Product visible');
      } else {
        toast.error('Failed to update product');
      }
    } catch {
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (
      !confirm('Are you sure you want to permanently delete this product? This cannot be undone.')
    )
      return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/products/${productId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchProducts();
        toast.success('Product deleted');
      } else {
        toast.error('Failed to delete product');
      }
    } catch {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-lg bg-neutral-900 p-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 transition-all ${
            activeTab === 'products'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <IconPackage size={16} />
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 transition-all ${
            activeTab === 'categories'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <IconLayoutGrid size={16} />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 transition-all ${
            activeTab === 'auctions'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <IconGavel size={16} />
          Auctions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' ? (
        <>
          {/* Products Header */}
          <div className="rounded-2xl border border-white/20 bg-black p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-white">Products ✨</h1>
                <p className="text-slate-400">Manage your product catalog and categories</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-black transition-colors hover:bg-white/80"
              >
                <IconPlus size={16} />
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div
              className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5'}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}
                >
                  <IconPackage
                    size={24}
                    className={mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}
                  />
                </div>
                <div
                  className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-blue-400'}`}
                >
                  <IconEye size={16} />
                  <span className="ml-1">{mode === 'live' ? 'Live' : 'Dev'}</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-white">{products.length}</p>
                <p className="text-sm text-slate-400">Total Products</p>
              </div>
            </div>

            <div
              className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}
                >
                  <IconEye
                    size={24}
                    className={mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}
                  />
                </div>
                <div
                  className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-emerald-400'}`}
                >
                  <IconPackage size={16} />
                  <span className="ml-1">Active</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-white">
                  {products.filter(p => p.is_active).length}
                </p>
                <p className="text-sm text-slate-400">Active Products</p>
              </div>
            </div>

            <div
              className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5'}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}
                >
                  <IconStar
                    size={24}
                    className={mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}
                  />
                </div>
                <div
                  className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}`}
                >
                  <IconStar size={16} />
                  <span className="ml-1">Featured</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-white">
                  {products.filter(p => p.featured).length}
                </p>
                <p className="text-sm text-slate-400">Featured Products</p>
              </div>
            </div>

            <div
              className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5'}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-red-500/20'}`}
                >
                  <IconTag
                    size={24}
                    className={mode === 'dev' ? 'text-orange-400' : 'text-red-400'}
                  />
                </div>
                <div
                  className={`flex items-center text-sm ${mode === 'dev' ? 'text-orange-400' : 'text-red-400'}`}
                >
                  <IconTag size={16} />
                  <span className="ml-1">Sale</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-2xl font-bold text-white">
                  {products.filter(p => p.on_sale).length}
                </p>
                <p className="text-sm text-slate-400">On Sale</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-white/20 bg-black p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <IconSearch
                    size={16}
                    className="absolute top-1/2 left-3 -translate-y-1/2 transform text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-4 pl-10 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
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
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-black">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="p-4 text-left font-medium text-slate-400">Product</th>
                    <th className="p-4 text-left font-medium text-slate-400">Category</th>
                    <th className="p-4 text-left font-medium text-slate-400">Price</th>
                    <th className="p-4 text-left font-medium text-slate-400">Stock</th>
                    <th className="p-4 text-left font-medium text-slate-400">Status</th>
                    <th className="p-4 text-left font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <IconPackage size={48} className="text-slate-500" />
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
                    filteredProducts.map(product => (
                      <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-700">
                              {product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <IconPackage size={20} className="text-slate-400" />
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
                            <span className="font-medium text-white">
                              $
                              {product.on_sale && product.sale_price
                                ? product.sale_price
                                : product.price}
                            </span>
                            {product.on_sale && product.sale_price && (
                              <span className="text-sm text-slate-400 line-through">
                                ${product.price}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded px-2 py-1.5 text-xs leading-relaxed ${
                              product.inventory > 10
                                ? 'bg-white/20 text-white'
                                : product.inventory > 0
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {product.inventory}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-1 text-xs ${
                                product.is_active
                                  ? 'bg-white/20 text-white'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {product.featured && (
                              <span className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                                Featured
                              </span>
                            )}
                            {product.on_sale && (
                              <span className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400">
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
                              <IconPencil size={16} />
                            </button>
                            <button
                              onClick={() =>
                                toggleProductStatus(
                                  product.id,
                                  product.metadata?.frontend_visible !== false
                                )
                              }
                              className="p-1 text-slate-400 hover:text-white"
                              title={
                                product.metadata?.frontend_visible !== false
                                  ? 'Hide from frontend'
                                  : 'Show on frontend'
                              }
                            >
                              {product.metadata?.frontend_visible !== false ? (
                                <IconEye size={16} />
                              ) : (
                                <IconEyeOff size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1 text-slate-400 hover:text-red-400"
                              title="Delete product"
                            >
                              <IconTrash size={16} />
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
        </>
      ) : activeTab === 'categories' ? (
        <Categories />
      ) : (
        <AuctionsManager />
      )}
    </div>
  );
}

// Auction interfaces
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
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'pending' | 'cancelled';
  is_active: boolean;
  bid_count: number;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface AuctionFormData {
  title: string;
  description: string;
  images: string[];
  video_url: string;
  featured_image_index: number;
  starting_bid: number;
  reserve_price: number | null;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  details: string;
  shipping_info: string;
}

// Auctions Manager Component
function AuctionsManager() {
  const { mode } = useMode();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [error, setError] = useState('');

  const getDefaultFormData = () => {
    // Get current time in Mountain Time (MST/MDT)
    const now = new Date();
    const mountainTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    const endTime = new Date(mountainTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Format for datetime-local inputs (YYYY-MM-DD and HH:MM)
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTime = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    return {
      title: '',
      description: '',
      images: [],
      video_url: '',
      featured_image_index: 0,
      starting_bid: 0,
      reserve_price: null,
      start_date: formatDate(mountainTime),
      start_time: formatTime(mountainTime),
      end_date: formatDate(endTime),
      end_time: formatTime(endTime),
      details: [
        'Premium quality gemstone',
        'Authentically sourced',
        'Lifetime guarantee',
        'Certificate of authenticity included',
      ].join('\n'),
      shipping_info: 'Free worldwide shipping. Delivery in 3-5 business days.',
    };
  };

  // Form data state
  const [formData, setFormData] = useState<AuctionFormData>(getDefaultFormData());

  // Load auctions data from API
  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('admin-token');
      if (!token) {
        setError('No admin token found');
        return;
      }

      const response = await fetch('/api/auctions?includeInactive=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAuctions(data.auctions || []);
      } else {
        setError(data.message || 'Failed to fetch auctions');
      }
    } catch {
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || auction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTimeLeft = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const timeDiff = end - now;

    if (timeDiff <= 0) return 'Ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        setError('No admin token found');
        return;
      }

      // Combine date and time strings to create full datetime objects
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      const now = new Date();

      // Validation
      if (startDateTime <= now) {
        setError('Start date/time must be in the future');
        return;
      }

      if (endDateTime <= startDateTime) {
        setError('End date/time must be after start date/time');
        return;
      }

      // Check maximum duration (1 month = 30 days)
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const maxDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      if (durationMs > maxDurationMs) {
        setError('Auction duration cannot exceed 1 month (30 days)');
        return;
      }

      const auctionData = {
        title: formData.title,
        description: formData.description,
        images: formData.images,
        video_url: formData.video_url || null,
        featured_image_index: formData.featured_image_index,
        starting_bid: formData.starting_bid,
        reserve_price: formData.reserve_price,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        metadata: {
          details: formData.details
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean),
          shipping_info: formData.shipping_info,
        },
      };

      if (editingAuction) {
        // Update existing auction
        const response = await fetch(`/api/auctions/${editingAuction.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(auctionData),
        });

        const data = await response.json();

        if (data.success) {
          // Refresh auctions list
          await fetchAuctions();
          toast.success('Auction updated');
        } else {
          setError(data.message || 'Failed to update auction');
          toast.error(data.message || 'Failed to update auction');
          return;
        }
      } else {
        // Create new auction
        const response = await fetch('/api/auctions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(auctionData),
        });

        const data = await response.json();

        if (data.success) {
          // Refresh auctions list
          await fetchAuctions();
          toast.success('Auction created');
        } else {
          setError(data.message || 'Failed to create auction');
          toast.error(data.message || 'Failed to create auction');
          return;
        }
      }

      handleCloseModal();
    } catch {
      setError('Failed to save auction');
    }
  };

  const handleEditAuction = (auction: Auction) => {
    setEditingAuction(auction);

    // Convert UTC times to local datetime-local format
    const startDate = new Date(auction.start_time);
    const endDate = new Date(auction.end_time);

    // Create local datetime strings for datetime-local inputs
    const startLocalString = new Date(
      startDate.getTime() - startDate.getTimezoneOffset() * 60000
    ).toISOString();
    const endLocalString = new Date(
      endDate.getTime() - endDate.getTimezoneOffset() * 60000
    ).toISOString();

    setFormData({
      title: auction.title,
      description: auction.description || '',
      images: auction.images,
      video_url: auction.video_url || '',
      featured_image_index: auction.featured_image_index || 0,
      starting_bid: auction.starting_bid,
      reserve_price: auction.reserve_price,
      start_date: startLocalString.split('T')[0],
      start_time: startLocalString.split('T')[1].slice(0, 5),
      end_date: endLocalString.split('T')[0],
      end_time: endLocalString.split('T')[1].slice(0, 5),
      details: (
        auction.metadata?.details || [
          'Premium quality gemstone',
          'Authentically sourced',
          'Lifetime guarantee',
          'Certificate of authenticity included',
        ]
      ).join('\n'),
      shipping_info:
        auction.metadata?.shipping_info ||
        'Free worldwide shipping. Delivery in 3-5 business days.',
    });
    setShowAuctionModal(true);
  };

  const toggleAuctionStatus = async (auction: Auction) => {
    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        setError('No admin token found');
        toast.error('No admin token found');
        return;
      }

      const newActiveStatus = !auction.is_active;
      const response = await fetch(`/api/auctions/${auction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newActiveStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh auctions list
        await fetchAuctions();
        toast.success(newActiveStatus ? 'Auction activated' : 'Auction deactivated');
      } else {
        setError(data.message || 'Failed to update auction status');
        toast.error(data.message || 'Failed to update auction');
      }
    } catch {
      setError('Failed to update auction status');
      toast.error('Failed to update auction');
    }
  };

  const deleteAuction = async (auction: Auction) => {
    if (!confirm(`Delete "${auction.title}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        setError('No admin token found');
        toast.error('No admin token found');
        return;
      }

      const response = await fetch(`/api/auctions/${auction.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh auctions list
        await fetchAuctions();
        toast.success('Auction deleted');
      } else {
        setError(data.message || 'Failed to delete auction');
        toast.error(data.message || 'Failed to delete auction');
      }
    } catch {
      setError('Failed to delete auction');
      toast.error('Failed to delete auction');
    }
  };

  const handleCloseModal = () => {
    setShowAuctionModal(false);
    setEditingAuction(null);
    setFormData(getDefaultFormData());
    setError('');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="48" />
      </div>
    );
  }

  return (
    <>
      {/* Auctions Header */}
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white">Auctions 🔨</h1>
            <p className="text-slate-400">Manage auction listings and bidding</p>
          </div>
          <button
            onClick={() => {
              setFormData(getDefaultFormData()); // Reset form with current time
              setShowAuctionModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-black transition-colors hover:bg-white/80"
          >
            <IconPlus size={16} />
            Create Auction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-purple-500/20'}`}
            >
              <IconGavel
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-purple-400'}
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">{auctions.length}</p>
            <p className="text-sm text-slate-400">Total Auctions</p>
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-green-500/20'}`}
            >
              <IconEye
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-green-400'}
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">
              {auctions.filter(a => a.status === 'active').length}
            </p>
            <p className="text-sm text-slate-400">Active Auctions</p>
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}
            >
              <IconTag size={24} className={mode === 'dev' ? 'text-orange-400' : 'text-blue-400'} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">
              {auctions.filter(a => a.status === 'ended').length}
            </p>
            <p className="text-sm text-slate-400">Ended Auctions</p>
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`rounded-xl p-3 ${mode === 'dev' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}
            >
              <IconStar
                size={24}
                className={mode === 'dev' ? 'text-orange-400' : 'text-yellow-400'}
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-2xl font-bold text-white">
              ${auctions.reduce((total, auction) => total + auction.current_bid, 0).toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">Total Bid Value</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <IconSearch
                size={16}
                className="absolute top-1/2 left-3 -translate-y-1/2 transform text-slate-400"
              />
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-4 pl-10 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Auctions Table */}
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-black">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="p-4 text-left font-medium text-slate-400">Auction</th>
                <th className="p-4 text-left font-medium text-slate-400">Current Bid</th>
                <th className="p-4 text-left font-medium text-slate-400">Bids</th>
                <th className="p-4 text-left font-medium text-slate-400">Time Left</th>
                <th className="p-4 text-left font-medium text-slate-400">Status</th>
                <th className="p-4 text-left font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuctions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <IconGavel size={48} className="text-slate-500" />
                      <p className="text-slate-400">No auctions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAuctions.map(auction => (
                  <tr key={auction.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-700">
                          {auction.images && auction.images.length > 0 ? (
                            <Image
                              src={auction.images[auction.featured_image_index || 0]}
                              alt={auction.title}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <IconGavel size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{auction.title}</p>
                          <p className="line-clamp-1 text-sm text-slate-400">
                            {auction.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="font-medium text-white">
                          ${auction.current_bid.toFixed(2)}
                        </span>
                        {auction.reserve_price && auction.current_bid < auction.reserve_price && (
                          <span className="block text-xs text-orange-400">
                            Reserve: ${auction.reserve_price}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{auction.bid_count}</td>
                    <td className="p-4">
                      <span
                        className={`text-sm ${
                          auction.status === 'ended'
                            ? 'text-red-400'
                            : getTimeLeft(auction.end_time).includes('h') ||
                                getTimeLeft(auction.end_time).includes('d')
                              ? 'text-white'
                              : 'text-yellow-400'
                        }`}
                      >
                        {getTimeLeft(auction.end_time)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          auction.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : auction.status === 'ended'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAuction(auction)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Edit auction"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          onClick={() => toggleAuctionStatus(auction)}
                          className="p-1 text-slate-400 hover:text-white"
                          title={auction.is_active ? 'Deactivate auction' : 'Activate auction'}
                        >
                          {auction.is_active ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => deleteAuction(auction)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete auction"
                        >
                          <IconTrash size={16} />
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

      {/* Auction Modal */}
      {showAuctionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-black p-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              {editingAuction ? 'Edit Auction' : 'Create New Auction'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Auction Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  placeholder="e.g., Rare Alberta Ammolite"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  placeholder="Describe your gemstone or mineral..."
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Starting Bid ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.starting_bid}
                  onChange={e =>
                    setFormData({ ...formData, starting_bid: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Reserve Price ($)
                  <span className="font-normal text-slate-500"> (optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.reserve_price || ''}
                  onChange={e =>
                    setFormData({ ...formData, reserve_price: parseFloat(e.target.value) || null })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  placeholder="Minimum price to sell"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Start Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="date-input w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Start Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      className="time-input w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    End Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      className="date-input w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    End Time *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                      className="time-input w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="-mt-2 text-xs text-slate-400">
                Maximum auction duration: 1 month (30 days)
              </div>

              {/* Auction Details */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Auction Details (one per line)
                </label>
                <textarea
                  value={formData.details}
                  onChange={e => setFormData({ ...formData, details: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  placeholder="Premium quality gemstone&#10;Authentically sourced&#10;Lifetime guarantee&#10;Certificate of authenticity included"
                />
                <p className="mt-1 text-xs text-slate-400">
                  These will appear as bullet points on the auction page
                </p>
              </div>

              {/* Shipping Information */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Shipping Information
                </label>
                <textarea
                  value={formData.shipping_info}
                  onChange={e => setFormData({ ...formData, shipping_info: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                  placeholder="Free worldwide shipping. Delivery in 3-5 business days."
                />
                <p className="mt-1 text-xs text-slate-400">
                  This will appear in the shipping section on the auction page
                </p>
              </div>

              <ImageUpload
                images={formData.images}
                video_url={formData.video_url || undefined}
                featured_image_index={formData.featured_image_index}
                onImagesChange={(images: string[]) => setFormData({ ...formData, images })}
                onVideoChange={(videoUrl: string | null) =>
                  setFormData({ ...formData, video_url: videoUrl || '' })
                }
                onFeaturedImageChange={(index: number) =>
                  setFormData({ ...formData, featured_image_index: index })
                }
                maxImages={8}
                folder="auctions"
                label="Auction Media"
                description="Upload up to 8 images and 1 video of your gemstone or mineral (drag & drop or click to browse)"
              />

              <div className="flex gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-slate-400 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-white/80"
                >
                  {editingAuction ? 'Update Auction' : 'Create Auction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom CSS for date and time inputs */}
      <style jsx>{`
        .date-input,
        .time-input {
          color-scheme: dark;
          position: relative;
          overflow: hidden;
        }

        .date-input::-webkit-calendar-picker-indicator,
        .time-input::-webkit-calendar-picker-indicator {
          background: transparent;
          color: transparent;
          cursor: pointer;
          height: 20px;
          width: 20px;
          position: relative;
          margin-left: 4px;
        }

        .date-input::-webkit-calendar-picker-indicator:hover,
        .time-input::-webkit-calendar-picker-indicator:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        /* Style the actual picker popup */
        .date-input::-webkit-datetime-edit,
        .time-input::-webkit-datetime-edit {
          color: white;
          padding: 0;
        }

        .date-input::-webkit-datetime-edit-fields-wrapper,
        .time-input::-webkit-datetime-edit-fields-wrapper {
          background: transparent;
        }

        .date-input::-webkit-datetime-edit-text,
        .time-input::-webkit-datetime-edit-text {
          color: rgba(255, 255, 255, 0.7);
          padding: 0 2px;
        }

        .date-input::-webkit-datetime-edit-month-field,
        .date-input::-webkit-datetime-edit-day-field,
        .date-input::-webkit-datetime-edit-year-field,
        .time-input::-webkit-datetime-edit-hour-field,
        .time-input::-webkit-datetime-edit-minute-field {
          color: white;
          background: transparent;
          border: none;
          padding: 2px;
        }

        .date-input::-webkit-datetime-edit-month-field:focus,
        .date-input::-webkit-datetime-edit-day-field:focus,
        .date-input::-webkit-datetime-edit-year-field:focus,
        .time-input::-webkit-datetime-edit-hour-field:focus,
        .time-input::-webkit-datetime-edit-minute-field:focus {
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          border-radius: 2px;
        }

        /* Firefox specific styles */
        .date-input[type='date'],
        .time-input[type='time'] {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .date-input[type='date']:focus,
        .time-input[type='time']:focus {
          border-color: white;
        }
      `}</style>
    </>
  );
}

// Product Modal Component
function ProductModal({
  product,
  onClose,
  onSave,
}: {
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
    details: (
      product?.metadata?.details || [
        'Premium quality gemstone',
        'Authentically sourced',
        'Lifetime guarantee',
        'Certificate of authenticity included',
      ]
    ).join('\n'),
    // Shipping info
    shipping_info:
      product?.metadata?.shipping_info || 'Free worldwide shipping. Delivery in 3-5 business days.',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
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
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        images: formData.images,
        video_url: formData.video_url || null,
        featured_image_index: 0,
        metadata: {
          ...(product?.metadata || {}),
          details: formData.details
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean),
          shipping_info: formData.shipping_info,
        },
      };

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(product ? 'Product updated' : 'Product created');
        onSave();
      } else {
        toast.error(data.message || 'Failed to save product');
      }
    } catch {
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/20 bg-black p-6">
        <h2 className="mb-6 text-xl font-bold text-white">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              placeholder="Product description..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Price * ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Sale Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={e => setFormData(prev => ({ ...prev, sale_price: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Inventory</label>
              <input
                type="number"
                value={formData.inventory}
                onChange={e => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Weight (grams)</label>
            <input
              type="number"
              step="0.001"
              value={formData.weight}
              onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              placeholder="0.000"
            />
          </div>

          {/* Shipping */}

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              placeholder="gold, handmade, vintage, etc."
            />
          </div>

          {/* Product Details */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Product Details (one per line)
            </label>
            <textarea
              value={formData.details}
              onChange={e => setFormData(prev => ({ ...prev, details: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              placeholder="Premium quality gemstone&#10;Authentically sourced&#10;Lifetime guarantee&#10;Certificate of authenticity included"
            />
            <p className="mt-1 text-xs text-slate-400">
              These will appear as bullet points on the product page
            </p>
          </div>

          {/* Shipping Information */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Shipping Information
            </label>
            <textarea
              value={formData.shipping_info}
              onChange={e => setFormData(prev => ({ ...prev, shipping_info: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              placeholder="Free worldwide shipping. Delivery in 3-5 business days."
            />
            <p className="mt-1 text-xs text-slate-400">
              This will appear in the shipping section on the product page
            </p>
          </div>

          {/* Media Upload (Images + Video) */}
          <ImageUpload
            images={formData.images}
            video_url={formData.video_url || undefined}
            featured_image_index={formData.featured_image_index}
            onImagesChange={images => {
              setFormData(prev => ({ ...prev, images }));
              // Featured image is always the first image
              setFormData(prev => ({ ...prev, featured_image_index: 0 }));
            }}
            onVideoChange={videoUrl => {
              setFormData(prev => ({ ...prev, video_url: videoUrl || '' }));
            }}
            onFeaturedImageChange={() => {
              setFormData(prev => ({ ...prev, featured_image_index: 0 }));
            }}
            maxImages={8}
            folder="products"
            label="Product Media"
            description="Upload up to 8 images and 1 video (drag & drop or click to browse)"
          />

          {/* Status Options */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded"
              />
              Featured Product
            </label>

            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.on_sale}
                onChange={e => setFormData(prev => ({ ...prev, on_sale: e.target.checked }))}
                className="rounded"
              />
              On Sale
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 border-t border-white/10 pt-4">
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
              className="flex-1 rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-white/80 disabled:bg-white/50"
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
