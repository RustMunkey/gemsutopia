'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  section: string;
  key: string;
  value: string;
  contentType: string | null;
  isActive: boolean | null;
}

interface HeroImage {
  id: number | string;
  name: string;
  image: string;
}

interface Stat {
  id: string;
  title: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
}

interface FeaturedProduct {
  id: string;
  name: string;
  price: string;
  salePrice: string | null;
  onSale: boolean;
  images: string[];
  inventory: number;
  featured: boolean;
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Hero state
  const [heroTitle, setHeroTitle] = useState('');
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [newImageName, setNewImageName] = useState('');

  // Stats state
  const [statsList, setStatsList] = useState<Stat[]>([]);
  const [newStatTitle, setNewStatTitle] = useState('');
  const [newStatValue, setNewStatValue] = useState('');
  const [addingStat, setAddingStat] = useState(false);

  // Featured state
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [savingFeaturedTitle, setSavingFeaturedTitle] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<FeaturedProduct[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdSalePrice, setNewProdSalePrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('99');
  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  // About / Earth to You / Quality state
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [aboutImage, setAboutImage] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);

  const [earthTitle, setEarthTitle] = useState('');
  const [earthText, setEarthText] = useState('');
  const [earthImage, setEarthImage] = useState('');
  const [savingEarth, setSavingEarth] = useState(false);
  const [uploadingEarth, setUploadingEarth] = useState(false);

  const [qualityTitle, setQualityTitle] = useState('');
  const [qualityText, setQualityText] = useState('');
  const [qualityImage, setQualityImage] = useState('');
  const [savingQuality, setSavingQuality] = useState(false);
  const [uploadingQuality, setUploadingQuality] = useState(false);

  // FAQ state
  interface FAQItem {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
  }
  const [faqTitle, setFaqTitle] = useState('');
  const [savingFaqTitle, setSavingFaqTitle] = useState(false);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [addingFaq, setAddingFaq] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStatsList(data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const prods: FeaturedProduct[] = data.data || [];
        setAllProducts(prods);
        setFeaturedProducts(prods.filter(p => p.featured));
      }
    } catch { /* silent */ }
  }, []);

  const fetchFaq = useCallback(async () => {
    try {
      const res = await fetch('/api/faq');
      if (res.ok) {
        const data = await res.json();
        setFaqItems(data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      // Fast fetch - large values (base64 images) are stripped
      const res = await fetch('/api/content');
      if (!res.ok) {
        toast.error('Failed to fetch content: ' + res.status);
        return;
      }
      const data = await res.json();
      const items: ContentItem[] = data.data || [];
      setContent(items);

      // Populate text fields from lightweight response
      const getVal = (section: string, key: string) =>
        items.find(i => i.section === section && i.key === key)?.value || '';

      setHeroTitle(getVal('hero', 'title'));
      setFeaturedTitle(getVal('featured', 'title'));
      setAboutTitle(getVal('about', 'title'));
      setAboutText(getVal('about', 'text'));
      setEarthTitle(getVal('earth_to_you', 'title'));
      setEarthText(getVal('earth_to_you', 'text'));
      setQualityTitle(getVal('quality', 'title'));
      setQualityText(getVal('quality', 'text'));
      setFaqTitle(getVal('faq', 'title'));

      // Fetch large values separately (base64 images)
      const [heroImgRes, aboutImgRes, earthImgRes, qualityImgRes] = await Promise.all([
        fetch('/api/content?section=hero&key=images'),
        fetch('/api/content?section=about&key=image'),
        fetch('/api/content?section=earth_to_you&key=image'),
        fetch('/api/content?section=quality&key=image'),
      ]);

      if (heroImgRes.ok) {
        const d = await heroImgRes.json();
        if (d.data?.[0]?.value) {
          try { setHeroImages(JSON.parse(d.data[0].value)); } catch { setHeroImages([]); }
        }
      }
      if (aboutImgRes.ok) {
        const d = await aboutImgRes.json();
        if (d.data?.[0]?.value) setAboutImage(d.data[0].value);
      }
      if (earthImgRes.ok) {
        const d = await earthImgRes.json();
        if (d.data?.[0]?.value) setEarthImage(d.data[0].value);
      }
      if (qualityImgRes.ok) {
        const d = await qualityImgRes.json();
        if (d.data?.[0]?.value) setQualityImage(d.data[0].value);
      }
    } catch (err) {
      toast.error('Failed to fetch content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchStats();
    fetchProducts();
    fetchFaq();
  }, [fetchContent, fetchStats, fetchProducts, fetchFaq]);

  async function saveField(section: string, key: string, value: string, contentType = 'text') {
    const existing = content.find(i => i.section === section && i.key === key);

    if (existing) {
      const res = await fetch(`/api/content/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, contentType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update (${res.status})`);
      }
      return res.json();
    } else {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, key, value, contentType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create (${res.status})`);
      }
      return res.json();
    }
  }

  async function saveHero() {
    setSaving(true);
    try {
      await saveField('hero', 'title', heroTitle);
      await saveField('hero', 'images', JSON.stringify(heroImages), 'json');
      toast.success('Hero section saved! Changes are live on the storefront.');
      // No refetch needed - local state is already up to date
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Image management
  function removeImage(id: number | string) {
    setHeroImages(prev => prev.filter(img => img.id !== id));
  }

  function moveImage(index: number, direction: 'up' | 'down') {
    const newImages = [...heroImages];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= newImages.length) return;
    [newImages[index], newImages[swap]] = [newImages[swap], newImages[index]];
    setHeroImages(newImages);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'banners');
      formData.append('folder', 'hero');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        setHeroImages(prev => [...prev, {
          id: Date.now(),
          name: newImageName || file.name.replace(/\.[^.]+$/, ''),
          image: data.url,
        }]);
        setNewImageName('');
        toast.success('Image uploaded! Click "Save Hero Section" to publish.');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  // Stats CRUD
  async function addStat() {
    if (!newStatTitle.trim() || !newStatValue.trim()) {
      toast.error('Title and value are required');
      return;
    }
    setAddingStat(true);
    try {
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newStatTitle.trim(), value: newStatValue.trim(), sortOrder: statsList.length }),
      });
      if (!res.ok) throw new Error('Failed to create');
      toast.success('Stat added!');
      setNewStatTitle('');
      setNewStatValue('');
      await fetchStats();
    } catch { toast.error('Failed to add stat'); }
    finally { setAddingStat(false); }
  }

  async function updateStat(id: string, updates: Partial<Stat>) {
    try {
      const res = await fetch(`/api/stats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Stat updated!');
      await fetchStats();
    } catch { toast.error('Failed to update stat'); }
  }

  async function deleteStat(id: string) {
    try {
      const res = await fetch(`/api/stats/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Stat deleted!');
      await fetchStats();
    } catch { toast.error('Failed to delete stat'); }
  }

  async function moveStatUp(index: number) {
    if (index === 0) return;
    const current = statsList[index];
    const above = statsList[index - 1];
    try {
      await Promise.all([
        fetch(`/api/stats/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: above.sortOrder }) }),
        fetch(`/api/stats/${above.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: current.sortOrder }) }),
      ]);
      await fetchStats();
    } catch { toast.error('Failed to reorder'); }
  }

  async function moveStatDown(index: number) {
    if (index >= statsList.length - 1) return;
    const current = statsList[index];
    const below = statsList[index + 1];
    try {
      await Promise.all([
        fetch(`/api/stats/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: below.sortOrder }) }),
        fetch(`/api/stats/${below.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: current.sortOrder }) }),
      ]);
      await fetchStats();
    } catch { toast.error('Failed to reorder'); }
  }

  // Featured products CRUD
  async function addFeaturedProduct(imageDataUrl: string) {
    if (!newProdName.trim() || !newProdPrice.trim()) {
      toast.error('Name and price are required');
      return;
    }
    setAddingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName.trim(),
          price: newProdPrice.trim(),
          salePrice: newProdSalePrice.trim() || null,
          image: imageDataUrl,
          stock: newProdStock.trim() ? Number(newProdStock.trim()) : 99,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      toast.success('Featured product added!');
      setNewProdName('');
      setNewProdPrice('');
      setNewProdSalePrice('');
      setNewProdStock('99');
      await fetchProducts();
    } catch { toast.error('Failed to add product'); }
    finally { setAddingProduct(false); }
  }

  async function toggleFeatured(id: string, featured: boolean) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(featured ? 'Added to featured!' : 'Removed from featured');
      await fetchProducts();
    } catch { toast.error('Failed to update'); }
  }

  async function deleteFeaturedProduct(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted!');
      await fetchProducts();
    } catch { toast.error('Failed to delete product'); }
  }

  async function handleFeaturedImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newProdName.trim() || !newProdPrice.trim()) {
      toast.error('Enter name and price first');
      e.target.value = '';
      return;
    }
    setUploadingFeatured(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        await addFeaturedProduct(data.url);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploadingFeatured(false); e.target.value = ''; }
  }

  // Section save functions
  async function saveSection(section: string, title: string, text: string, image: string, setSavingFn: (v: boolean) => void) {
    setSavingFn(true);
    try {
      await Promise.all([
        saveField(section, 'title', title),
        saveField(section, 'text', text),
        ...(image ? [saveField(section, 'image', image)] : []),
      ]);
      toast.success(`${section.replace('_', ' ')} section saved!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingFn(false);
    }
  }

  async function handleSectionImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (v: string) => void,
    setUploading: (v: boolean) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        setImage(data.url);
        toast.success('Image uploaded! Click Save to publish.');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  }

  // FAQ CRUD
  async function addFaq() {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setAddingFaq(true);
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newFaqQuestion.trim(), answer: newFaqAnswer.trim(), sortOrder: faqItems.length }),
      });
      if (!res.ok) throw new Error('Failed to create');
      toast.success('FAQ added!');
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      await fetchFaq();
    } catch { toast.error('Failed to add FAQ'); }
    finally { setAddingFaq(false); }
  }

  async function updateFaq(id: string, updates: Partial<FAQItem>) {
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('FAQ updated!');
      await fetchFaq();
    } catch { toast.error('Failed to update FAQ'); }
  }

  async function deleteFaq(id: string) {
    try {
      const res = await fetch(`/api/faq/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('FAQ deleted!');
      await fetchFaq();
    } catch { toast.error('Failed to delete FAQ'); }
  }

  async function moveFaqUp(index: number) {
    if (index === 0) return;
    const current = faqItems[index];
    const above = faqItems[index - 1];
    try {
      await Promise.all([
        fetch(`/api/faq/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: above.sortOrder }) }),
        fetch(`/api/faq/${above.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: current.sortOrder }) }),
      ]);
      await fetchFaq();
    } catch { toast.error('Failed to reorder'); }
  }

  async function moveFaqDown(index: number) {
    if (index >= faqItems.length - 1) return;
    const current = faqItems[index];
    const below = faqItems[index + 1];
    try {
      await Promise.all([
        fetch(`/api/faq/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: below.sortOrder }) }),
        fetch(`/api/faq/${below.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: current.sortOrder }) }),
      ]);
      await fetchFaq();
    } catch { toast.error('Failed to reorder'); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-foreground rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Homepage Content</h1>

      {/* Hero Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold border-b pb-3">Hero Section</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hero Title
          </label>
          <input
            type="text"
            value={heroTitle}
            onChange={e => setHeroTitle(e.target.value)}
            placeholder="Enter hero title text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {heroTitle && (
            <button
              onClick={() => setHeroTitle('')}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Clear title
            </button>
          )}
        </div>

        {/* Carousel Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Carousel Images ({heroImages.length})
          </label>

          {heroImages.length === 0 && (
            <p className="text-sm text-gray-400 italic mb-4">
              No images yet. Upload images below to populate the hero carousel.
            </p>
          )}

          <div className="space-y-2 mb-4">
            {heroImages.map((img, index) => (
              <div key={img.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                <img
                  src={img.image}
                  alt={img.name}
                  className="h-16 w-16 object-cover rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = 'Failed to load'; }}
                />
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={img.name}
                    onChange={e => {
                      const updated = [...heroImages];
                      updated[index] = { ...updated[index], name: e.target.value };
                      setHeroImages(updated);
                    }}
                    className="text-sm px-2 py-1 border border-gray-200 rounded w-full"
                    placeholder="Image name"
                  />
                  <p className="text-xs text-gray-400 mt-1 truncate">{img.image}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === heroImages.length - 1}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => removeImage(img.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Upload new image */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Add New Image</p>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={newImageName}
                onChange={e => setNewImageName(e.target.value)}
                placeholder="Name (e.g. Amethyst)"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
              />
              <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium">
                {uploading ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={saveHero}
            disabled={saving}
            className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Hero Section'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Changes will appear instantly on the storefront via WebSocket.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-6 mt-6">
        <h2 className="text-lg font-semibold border-b pb-3">Stats Section</h2>
        <p className="text-sm text-gray-500">These appear below the hero on the storefront.</p>

        <div className="space-y-3">
          {statsList.map((stat, index) => (
            <div key={stat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveStatUp(index)}
                  disabled={index === 0}
                  className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveStatDown(index)}
                  disabled={index === statsList.length - 1}
                  className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  defaultValue={stat.title}
                  onBlur={(e) => {
                    if (e.target.value !== stat.title) updateStat(stat.id, { title: e.target.value });
                  }}
                  className="px-2 py-1 border border-gray-200 rounded text-sm"
                  placeholder="Title (e.g. Rocks Sold)"
                />
                <input
                  type="text"
                  defaultValue={stat.value}
                  onBlur={(e) => {
                    if (e.target.value !== stat.value) updateStat(stat.id, { value: e.target.value });
                  }}
                  className="px-2 py-1 border border-gray-200 rounded text-sm"
                  placeholder="Value (e.g. 250+)"
                />
              </div>
              <button
                onClick={() => deleteStat(stat.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
              >
                Delete
              </button>
            </div>
          ))}

          {statsList.length === 0 && (
            <p className="text-sm text-gray-400 italic">No stats yet. Add some below.</p>
          )}
        </div>

        {/* Add new stat */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add New Stat</p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={newStatTitle}
              onChange={e => setNewStatTitle(e.target.value)}
              placeholder="Title (e.g. Rocks Sold)"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-[150px]"
            />
            <input
              type="text"
              value={newStatValue}
              onChange={e => setNewStatValue(e.target.value)}
              placeholder="Value (e.g. 250+)"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-32"
            />
            <button
              onClick={addStat}
              disabled={addingStat}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {addingStat ? 'Adding...' : 'Add Stat'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Click on any field to edit inline. Changes push to storefront instantly.
        </p>
      </div>

      {/* Featured Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-6 mt-6">
        <h2 className="text-lg font-semibold border-b pb-3">Featured Products</h2>
        <p className="text-sm text-gray-500">Products shown in the featured marquee on the homepage and /shop/featured.</p>

        {/* Section Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={featuredTitle}
              onChange={e => setFeaturedTitle(e.target.value)}
              placeholder="e.g. Featured Gems"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
            <button
              onClick={async () => {
                setSavingFeaturedTitle(true);
                try {
                  await saveField('featured', 'title', featuredTitle);
                  toast.success('Featured title saved!');
                  await fetchContent();
                } catch { toast.error('Failed to save title'); }
                finally { setSavingFeaturedTitle(false); }
              }}
              disabled={savingFeaturedTitle}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
            >
              {savingFeaturedTitle ? 'Saving...' : 'Save Title'}
            </button>
          </div>
        </div>

        {/* Currently featured */}
        <div className="space-y-3">
          {featuredProducts.map((prod) => (
            <div key={prod.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
              {prod.images?.[0] && prod.images[0] !== '' && (
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="h-14 w-14 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{prod.name}</p>
                <p className="text-xs text-gray-500">
                  {prod.onSale && prod.salePrice ? (
                    <><span className="line-through">${prod.price}</span> <span className="text-green-600">${prod.salePrice}</span></>
                  ) : (
                    <>${prod.price}</>
                  )}
                  {' '}· Stock: {prod.inventory}
                </p>
              </div>
              <button
                onClick={() => toggleFeatured(prod.id, false)}
                className="text-orange-600 hover:text-orange-800 text-xs font-medium px-2 py-1"
              >
                Unfeature
              </button>
              <button
                onClick={() => deleteFeaturedProduct(prod.id)}
                className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1"
              >
                Delete
              </button>
            </div>
          ))}

          {featuredProducts.length === 0 && (
            <p className="text-sm text-gray-400 italic">No featured products. Add some below or feature existing products.</p>
          )}
        </div>

        {/* Add new featured product */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add New Featured Product</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={newProdName}
              onChange={e => setNewProdName(e.target.value)}
              placeholder="Product name"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm col-span-2"
            />
            <input
              type="text"
              value={newProdPrice}
              onChange={e => setNewProdPrice(e.target.value)}
              placeholder="Price (e.g. 49.99)"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              value={newProdSalePrice}
              onChange={e => setNewProdSalePrice(e.target.value)}
              placeholder="Sale price (optional)"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="text"
              value={newProdStock}
              onChange={e => setNewProdStock(e.target.value)}
              placeholder="Stock (default: 99)"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <label className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium text-center">
              {uploadingFeatured ? 'Uploading...' : 'Upload Image & Add'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFeaturedImageUpload}
                className="hidden"
                disabled={uploadingFeatured || addingProduct}
              />
            </label>
          </div>
        </div>

        {/* Existing products - toggle featured */}
        {allProducts.filter(p => !p.featured).length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Existing Products (click to feature)</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allProducts.filter(p => !p.featured).map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                  {prod.images?.[0] && prod.images[0] !== '' && (
                    <img src={prod.images[0]} alt={prod.name} className="h-10 w-10 object-cover rounded flex-shrink-0" />
                  )}
                  <span className="text-sm flex-1 truncate">{prod.name}</span>
                  <span className="text-xs text-gray-500">${prod.price}</span>
                  <button
                    onClick={() => toggleFeatured(prod.id, true)}
                    className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1"
                  >
                    Feature
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* About Gemsutopia Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-4 mt-6">
        <h2 className="text-lg font-semibold border-b pb-3">About Gemsutopia</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={aboutTitle}
            onChange={e => setAboutTitle(e.target.value)}
            placeholder="Section title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
          <textarea
            value={aboutText}
            onChange={e => setAboutText(e.target.value)}
            placeholder="Section text (use blank lines for paragraph breaks)"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          {aboutImage && (
            <div className="mb-2 relative inline-block">
              <img src={aboutImage} alt="About" className="h-24 rounded border" />
              <button onClick={() => setAboutImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
            </div>
          )}
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-md text-sm font-medium inline-block">
            {uploadingAbout ? 'Uploading...' : aboutImage ? 'Replace Image' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={e => handleSectionImageUpload(e, setAboutImage, setUploadingAbout)} className="hidden" disabled={uploadingAbout} />
          </label>
        </div>
        <button
          onClick={() => saveSection('about', aboutTitle, aboutText, aboutImage, setSavingAbout)}
          disabled={savingAbout}
          className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
        >
          {savingAbout ? 'Saving...' : 'Save About Section'}
        </button>
      </div>

      {/* From Earth to You Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-4 mt-6">
        <h2 className="text-lg font-semibold border-b pb-3">From Earth to You</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={earthTitle}
            onChange={e => setEarthTitle(e.target.value)}
            placeholder="Section title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
          <textarea
            value={earthText}
            onChange={e => setEarthText(e.target.value)}
            placeholder="Section text (use blank lines for paragraph breaks)"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          {earthImage && (
            <div className="mb-2 relative inline-block">
              <img src={earthImage} alt="Earth to You" className="h-24 rounded border" />
              <button onClick={() => setEarthImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
            </div>
          )}
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-md text-sm font-medium inline-block">
            {uploadingEarth ? 'Uploading...' : earthImage ? 'Replace Image' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={e => handleSectionImageUpload(e, setEarthImage, setUploadingEarth)} className="hidden" disabled={uploadingEarth} />
          </label>
        </div>
        <button
          onClick={() => saveSection('earth_to_you', earthTitle, earthText, earthImage, setSavingEarth)}
          disabled={savingEarth}
          className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
        >
          {savingEarth ? 'Saving...' : 'Save Earth to You Section'}
        </button>
      </div>

      {/* Quality You Can Trust Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-4 mt-6">
        <h2 className="text-lg font-semibold border-b pb-3">Quality You Can Trust</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={qualityTitle}
            onChange={e => setQualityTitle(e.target.value)}
            placeholder="Section title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
          <textarea
            value={qualityText}
            onChange={e => setQualityText(e.target.value)}
            placeholder="Section text (use blank lines for paragraph breaks)"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          {qualityImage && (
            <div className="mb-2 relative inline-block">
              <img src={qualityImage} alt="Quality" className="h-24 rounded border" />
              <button onClick={() => setQualityImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
            </div>
          )}
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-md text-sm font-medium inline-block">
            {uploadingQuality ? 'Uploading...' : qualityImage ? 'Replace Image' : 'Upload Image'}
            <input type="file" accept="image/*" onChange={e => handleSectionImageUpload(e, setQualityImage, setUploadingQuality)} className="hidden" disabled={uploadingQuality} />
          </label>
        </div>
        <button
          onClick={() => saveSection('quality', qualityTitle, qualityText, qualityImage, setSavingQuality)}
          disabled={savingQuality}
          className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
        >
          {savingQuality ? 'Saving...' : 'Save Quality Section'}
        </button>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-6 mt-6">
        <h2 className="text-lg font-semibold border-b pb-3">FAQ Section</h2>
        <p className="text-sm text-gray-500">Questions & answers displayed under Quality on the storefront.</p>

        {/* Section Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={faqTitle}
              onChange={e => setFaqTitle(e.target.value)}
              placeholder="e.g. Frequently Asked Questions"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
            <button
              onClick={async () => {
                setSavingFaqTitle(true);
                try {
                  await saveField('faq', 'title', faqTitle);
                  toast.success('FAQ title saved!');
                } catch { toast.error('Failed to save title'); }
                finally { setSavingFaqTitle(false); }
              }}
              disabled={savingFaqTitle}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
            >
              {savingFaqTitle ? 'Saving...' : 'Save Title'}
            </button>
          </div>
        </div>

        {/* Existing FAQ items */}
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-md border space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveFaqUp(index)}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveFaqDown(index)}
                    disabled={index === faqItems.length - 1}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg leading-none"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    defaultValue={item.question}
                    onBlur={(e) => {
                      if (e.target.value !== item.question) updateFaq(item.id, { question: e.target.value });
                    }}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm font-medium"
                    placeholder="Question"
                  />
                  <textarea
                    defaultValue={item.answer}
                    onBlur={(e) => {
                      if (e.target.value !== item.answer) updateFaq(item.id, { answer: e.target.value });
                    }}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm resize-y"
                    placeholder="Answer"
                  />
                </div>
                <button
                  onClick={() => deleteFaq(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {faqItems.length === 0 && (
            <p className="text-sm text-gray-400 italic">No FAQ items yet. Add some below.</p>
          )}
        </div>

        {/* Add new FAQ */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add New FAQ</p>
          <div className="space-y-3">
            <input
              type="text"
              value={newFaqQuestion}
              onChange={e => setNewFaqQuestion(e.target.value)}
              placeholder="Question (e.g. What is your return policy?)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <textarea
              value={newFaqAnswer}
              onChange={e => setNewFaqAnswer(e.target.value)}
              placeholder="Answer"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-y"
            />
            <button
              onClick={addFaq}
              disabled={addingFaq}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {addingFaq ? 'Adding...' : 'Add FAQ'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Click on any field to edit inline. Changes push to storefront instantly.
        </p>
      </div>
    </div>
  );
}
