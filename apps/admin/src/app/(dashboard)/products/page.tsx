'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPackage,
} from '@tabler/icons-react';

interface Product {
  id: string;
  name: string;
  price: string;
  salePrice: string | null;
  onSale: boolean;
  inventory: number;
  images: string[];
  isActive: boolean;
  featured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  categoryId: string | null;
  gemstoneType: string | null;
  description: string | null;
  sku: string | null;
  origin: string | null;
  caratWeight: string | null;
  createdAt: string;
  category?: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
}

const emptyProduct = {
  name: '', price: '', salePrice: '', inventory: 1, description: '',
  sku: '', categoryId: '', gemstoneType: '', origin: '', caratWeight: '',
  images: [''], isActive: true, featured: false, isNew: false, isBestseller: false,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '', isActive: true });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 50 });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));

    try {
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      setProducts(json.data || []);
      if (json.pagination) setPagination(json.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, pagination.page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      setCategories(json.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openNew = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || '',
      inventory: product.inventory,
      description: product.description || '',
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      gemstoneType: product.gemstoneType || '',
      origin: product.origin || '',
      caratWeight: product.caratWeight || '',
      images: product.images,
      isActive: product.isActive,
      featured: product.featured,
      isNew: product.isNew,
      isBestseller: product.isBestseller,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          caratWeight: form.caratWeight ? parseFloat(form.caratWeight) : null,
          categoryId: form.categoryId || null,
        }),
      });
      if (res.ok) {
        toast.success(editingProduct ? 'Product updated' : 'Product created');
        setDialogOpen(false);
        fetchProducts();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      fetchProducts();
    } catch {}
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || null,
          image: categoryForm.image || null,
          isActive: categoryForm.isActive,
        }),
      });
      if (res.ok) {
        toast.success(editingCategory ? 'Category updated' : 'Category added');
        setCategoryForm({ name: '', description: '', image: '', isActive: true });
        setEditingCategory(null);
        fetchCategories();
      }
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} total products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategories(!showCategories)}>
            Categories
          </Button>
          <Button size="sm" onClick={openNew}>
            <IconPlus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* Categories Panel */}
      {showCategories && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">
              {editingCategory ? 'Edit Category' : 'Manage Categories'}
            </h3>
            <div className="grid gap-2 mb-3 sm:grid-cols-2 max-w-lg">
              <Input
                placeholder="Category name *"
                value={categoryForm.name}
                onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Image URL (optional)"
                value={categoryForm.image}
                onChange={e => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
              />
              <Input
                placeholder="Description (optional)"
                value={categoryForm.description}
                onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                className="sm:col-span-2"
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button size="sm" onClick={handleSaveCategory}>
                  {editingCategory ? 'Update' : 'Add'}
                </Button>
                {editingCategory && (
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', image: '', isActive: true });
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
                  {cat.name}
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryForm({
                        name: cat.name,
                        description: cat.description || '',
                        image: cat.image || '',
                        isActive: cat.isActive,
                      });
                    }}
                    className="ml-1 hover:text-primary"
                  >
                    <IconEdit className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="ml-0.5 hover:text-destructive">
                    <IconTrash className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconPackage className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No products found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {products.map(product => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {product.images?.[0] && product.images[0] !== '' ? (
                  <img src={product.images[0]} alt="" className="h-10 w-10 object-cover" />
                ) : (
                  <IconPackage className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  {product.isNew && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                  {product.featured && <Badge variant="secondary" className="text-[10px]">Featured</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {product.category && <span>{product.category.name}</span>}
                  {product.sku && <span>SKU: {product.sku}</span>}
                  <span>Stock: {product.inventory}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">
                  ${parseFloat(product.price).toFixed(2)}
                </p>
                {product.salePrice && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Sale: ${parseFloat(product.salePrice).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={product.isActive}
                  onCheckedChange={() => handleToggleActive(product)}
                  className="scale-75"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                  <IconEdit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Price (CAD) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <Label>Sale Price</Label>
                <Input type="number" step="0.01" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
              </div>
              <div>
                <Label>Inventory</Label>
                <Input type="number" value={form.inventory} onChange={e => setForm(f => ({ ...f, inventory: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gemstone Type</Label>
                <Input value={form.gemstoneType} onChange={e => setForm(f => ({ ...f, gemstoneType: e.target.value }))} />
              </div>
              <div>
                <Label>Origin</Label>
                <Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isNew} onCheckedChange={v => setForm(f => ({ ...f, isNew: v }))} />
                <Label>New</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isBestseller} onCheckedChange={v => setForm(f => ({ ...f, isBestseller: v }))} />
                <Label>Bestseller</Label>
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.images[0] || ''}
                onChange={e => setForm(f => ({ ...f, images: [e.target.value] }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
