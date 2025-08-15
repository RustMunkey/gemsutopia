'use client';
import { useState, useEffect } from 'react';
import { Edit2, Plus, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import Image from 'next/image';
import ImageUpload from './ImageUpload';

interface FeaturedProduct {
  id: string;
  name: string;
  type: string;
  description: string;
  image_url: string;
  card_color?: string;
  price: number;
  original_price: number;
  product_id?: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function FeaturedProductsManager() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<FeaturedProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/featured-products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (productData: Partial<FeaturedProduct>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const isEditing = editingProduct !== null;
      
      const response = await fetch('/api/admin/featured-products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productData,
          ...(isEditing && { id: editingProduct.id })
        })
      });

      if (response.ok) {
        await fetchProducts();
        setEditingProduct(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this featured product?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/featured-products?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const toggleActive = async (product: FeaturedProduct) => {
    await handleSave({
      ...product,
      is_active: !product.is_active
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'featured-products');

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
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
    <div className="bg-black rounded-2xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Featured Products</h3>
          <p className="text-slate-400">Manage the products shown in your featured section</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-medium">{product.name}</h4>
                  <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                    {product.type}
                  </span>
                  {!product.is_active && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Sort: {product.sort_order}</span>
                  {product.card_color && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Color:</span>
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: product.card_color }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(product)}
                  className={`p-2 rounded-lg transition-colors ${
                    product.is_active 
                      ? 'text-green-400 hover:bg-green-400/10' 
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={product.is_active ? 'Active' : 'Inactive'}
                >
                  {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => setEditingProduct(product)}
                  className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No featured products yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

interface ProductModalProps {
  product: FeaturedProduct | null;
  onSave: (data: Partial<FeaturedProduct>) => void;
  onCancel: () => void;
}

function ProductModal({ product, onSave, onCancel }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    type: product?.type || '',
    description: product?.description || '',
    image_url: product?.image_url || '',
    card_color: product?.card_color || '',
    product_id: product?.product_id?.toString() || '',
    sort_order: product?.sort_order?.toString() || '0',
    is_active: product?.is_active ?? true
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: 0,
      original_price: 0,
      product_id: formData.product_id ? parseInt(formData.product_id) : undefined,
      sort_order: parseInt(formData.sort_order) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-6">
          {product ? 'Edit Featured Product' : 'Add Featured Product'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white h-24"
              required
            />
          </div>

          <div>
            <ImageUpload
              images={formData.image_url ? [formData.image_url] : []}
              onImagesChange={(images) => setFormData(prev => ({ ...prev, image_url: images[0] || '' }))}
              maxImages={1}
              folder="featured"
              label="Featured Product Image"
              description="Upload image for featured product display"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Card Color (optional)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.card_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_color: e.target.value }))}
                  className="w-16 h-10 bg-white/5 border border-white/20 rounded-lg"
                />
                <input
                  type="text"
                  value={formData.card_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_color: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave empty to auto-extract from image</p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Link to Product ID (optional)</label>
              <input
                type="number"
                value={formData.product_id}
                onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-white text-sm">Active</label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}