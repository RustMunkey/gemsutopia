'use client';
import '../../styles/featuredproductsmanager.css';
import { useState, useEffect } from 'react';
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconPackage,
} from '@tabler/icons-react';
import Image from 'next/image';
import ImageUpload from './ImageUpload';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

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
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch {
      // Error fetching featured products
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...productData,
          ...(isEditing && { id: editingProduct.id }),
        }),
      });

      if (response.ok) {
        await fetchProducts();
        setEditingProduct(null);
        setShowAddModal(false);
        toast.success(isEditing ? 'Featured product updated' : 'Featured product created');
      } else {
        toast.error('Failed to save featured product');
      }
    } catch {
      toast.error('Failed to save featured product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this featured product?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/featured-products?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchProducts();
        toast.success('Featured product deleted');
      } else {
        toast.error('Failed to delete featured product');
      }
    } catch {
      toast.error('Failed to delete featured product');
    }
  };

  const toggleActive = async (product: FeaturedProduct) => {
    await handleSave({
      ...product,
      is_active: !product.is_active,
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
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch {
      throw new Error('Upload failed');
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
    <div className="rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Featured Products</h3>
          <p className="text-slate-400">Manage the products shown in your featured section</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-100"
        >
          <IconPlus size={16} />
          Add Product
        </button>
      </div>

      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
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
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="font-medium text-white">{product.name}</h4>
                  <span className="rounded bg-white/10 px-2 py-1 text-xs text-gray-400">
                    {product.type}
                  </span>
                  {!product.is_active && (
                    <span className="rounded bg-red-400/10 px-2 py-1 text-xs text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mb-2 line-clamp-2 text-sm text-gray-400">{product.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Sort: {product.sort_order}</span>
                  {product.card_color && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Color:</span>
                      <div
                        className="product-color-indicator h-4 w-4 rounded border border-white/20"
                        style={{ '--product-color': product.card_color } as React.CSSProperties}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(product)}
                  className={`rounded-lg p-2 transition-colors ${
                    product.is_active
                      ? 'text-green-400 hover:bg-green-400/10'
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={product.is_active ? 'Active' : 'Inactive'}
                >
                  {product.is_active ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                </button>

                <button
                  onClick={() => setEditingProduct(product)}
                  className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-400/10"
                  title="Edit"
                >
                  <IconPencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(product.id)}
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-400/10"
                  title="Delete"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <IconPackage size={48} className="mx-auto mb-4 opacity-50" />
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
    is_active: product?.is_active ?? true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-black p-6">
        <h3 className="mb-6 text-xl font-semibold text-white">
          {product ? 'Edit Featured Product' : 'Add Featured Product'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-24 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <ImageUpload
              images={formData.image_url ? [formData.image_url] : []}
              onImagesChange={images =>
                setFormData(prev => ({ ...prev, image_url: images[0] || '' }))
              }
              maxImages={1}
              folder="featured"
              label="Featured Product Image"
              description="Upload image for featured product display"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Card Color (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.card_color}
                  onChange={e => setFormData(prev => ({ ...prev, card_color: e.target.value }))}
                  className="h-10 w-16 rounded-lg border border-white/20 bg-white/5"
                />
                <input
                  type="text"
                  value={formData.card_color}
                  onChange={e => setFormData(prev => ({ ...prev, card_color: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Leave empty to auto-extract from image</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Link to Product ID (optional)
              </label>
              <input
                type="number"
                value={formData.product_id}
                onChange={e => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm text-white">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/20 px-6 py-2 text-white transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-2 text-black transition-colors hover:bg-gray-100"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
