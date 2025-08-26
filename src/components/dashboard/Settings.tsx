'use client';
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Truck, DollarSign, CreditCard, Search, Share2, Eye, Globe, Upload, Image as ImageIcon, Tag, Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import DiscountCodes from './DiscountCodes';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [dragOverFavicon, setDragOverFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [dragOverOgImage, setDragOverOgImage] = useState(false);
  const [uploadingTwitterImage, setUploadingTwitterImage] = useState(false);
  const [dragOverTwitterImage, setDragOverTwitterImage] = useState(false);
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Gemsutopia',
    siteFavicon: '/favicon.ico',
    
    // Shipping Settings
    enableShipping: true,
    shippingRates: [],
    internationalShipping: true,
    
    // Tax Settings  
    enableTaxes: true,
    taxRate: 13.0,
    taxExemptStates: [],
    
    // Payment Settings
    stripeEnabled: true,
    paypalEnabled: true,
    cryptoEnabled: true,
    
    // Currency Settings
    baseCurrency: 'CAD',
    supportedCurrencies: ['CAD', 'USD', 'EUR'],
    
    // SEO Settings
    seoTitle: 'Gemsutopia - Premium Gemstone Collection',
    seoDescription: 'Hi, I\'m Reese, founder of Gemsutopia and proud Canadian gem dealer from Alberta. Every gemstone is hand-selected, ethically sourced, and personally...',
    seoKeywords: 'gemstones, jewelry, natural stones, precious gems, Canadian gem dealer, Alberta, ethical sourcing',
    seoAuthor: 'Gemsutopia',
    openGraphTitle: '',
    openGraphDescription: '',
    openGraphImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        showNotification('error', 'Failed to load settings');
      }
    } catch (error) {
      showNotification('error', 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        showNotification('success', 'Settings saved successfully!');
        
        // Update favicon immediately if changed
        if (settings.siteFavicon) {
          updateFaviconInDOM(settings.siteFavicon);
        }
        
        // Update title immediately in dashboard
        if (settings.siteName) {
          document.title = settings.siteName + ' - Dashboard';
        }
        
        // Notify components about settings update
        if (typeof window !== 'undefined') {
          console.log('[SETTINGS] Dispatching settings update events...');
          window.dispatchEvent(new CustomEvent('settings-updated'));
          // Also trigger storage event for cross-tab updates
          localStorage.setItem('site-settings-updated', Date.now().toString());
          localStorage.removeItem('site-settings-updated'); // Trigger storage event
        }
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      showNotification('error', 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const uploadFavicon = async (file: File): Promise<string | null> => {
    try {
      setUploadingFavicon(true);
      
      const token = localStorage.getItem('admin-token');
      if (!token) {
        showNotification('error', 'Not authenticated. Please log in again.');
        return null;
      }

      // Validate file type
      const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/ico', 'image/icon', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.ico')) {
        showNotification('error', 'Please upload a valid favicon file (.ico, .png, .jpg, .gif, .svg)');
        return null;
      }

      // Check file size (max 1MB for favicon)
      if (file.size > 1024 * 1024) {
        showNotification('error', 'Favicon file size should be less than 1MB');
        return null;
      }

      console.log(`Processing favicon: ${file.name} (${file.size} bytes)`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'favicon');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadData.success) {
        console.log('Favicon upload successful:', uploadData.url);
        showNotification('success', 'Favicon uploaded successfully!');
        return uploadData.url;
      } else {
        console.log('Server-side favicon upload failed:', uploadData.message);
        showNotification('error', uploadData.message || 'Failed to upload favicon');
        return null;
      }
      
    } catch (error) {
      console.error('Error uploading favicon:', error);
      showNotification('error', 'Failed to upload favicon: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleFaviconUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const url = await uploadFavicon(file);
    if (url) {
      handleInputChange('siteFavicon', url);
      // Update favicon immediately
      updateFaviconInDOM(url);
    }
  };

  const handleFaviconInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFaviconUpload(e.target.files);
    }
  };

  const handleFaviconDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFavicon(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFaviconUpload(e.dataTransfer.files);
    }
  };

  const handleFaviconDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFavicon(true);
  };

  const handleFaviconDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFavicon(false);
  };

  const updateFaviconInDOM = (faviconUrl: string) => {
    // Update existing favicon link or create new one
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = faviconUrl;
    
    // Also update shortcut icon if it exists
    const shortcutIcon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
    if (shortcutIcon) {
      shortcutIcon.href = faviconUrl;
    }
    
    console.log('Updated favicon in DOM:', faviconUrl);
  };

  const uploadSocialImage = async (file: File, imageType: 'og' | 'twitter'): Promise<string | null> => {
    try {
      const setUploading = imageType === 'og' ? setUploadingOgImage : setUploadingTwitterImage;
      setUploading(true);
      
      console.log(`[SOCIAL UPLOAD] Starting ${imageType} image upload:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const token = localStorage.getItem('admin-token');
      if (!token) {
        console.error('[SOCIAL UPLOAD] No admin token found');
        showNotification('error', 'Not authenticated. Please log in again.');
        return null;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        console.error('[SOCIAL UPLOAD] Invalid file type:', file.type);
        showNotification('error', 'Please upload a valid image file (.jpg, .png, .webp, .gif)');
        return null;
      }

      // Check file size (max 5MB for social images)
      if (file.size > 5 * 1024 * 1024) {
        console.error('[SOCIAL UPLOAD] File too large:', file.size);
        showNotification('error', 'Image file size should be less than 5MB');
        return null;
      }

      console.log(`[SOCIAL UPLOAD] Validation passed, uploading ${imageType} image...`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'social'); // Simplified folder name
      
      console.log(`[SOCIAL UPLOAD] Making API request...`);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log(`[SOCIAL UPLOAD] API response status:`, uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[SOCIAL UPLOAD] Upload response not OK:', errorText);
        showNotification('error', `Upload failed: ${uploadResponse.status} - ${errorText}`);
        return null;
      }

      const uploadData = await uploadResponse.json();
      console.log(`[SOCIAL UPLOAD] API response data:`, uploadData);
      
      if (uploadData.success) {
        console.log(`[SOCIAL UPLOAD] ${imageType} image upload successful:`, uploadData.url);
        showNotification('success', `${imageType.toUpperCase()} image uploaded successfully!`);
        return uploadData.url;
      } else {
        console.error(`[SOCIAL UPLOAD] ${imageType} image upload failed:`, uploadData.message);
        showNotification('error', uploadData.message || `Failed to upload ${imageType} image`);
        return null;
      }
      
    } catch (error) {
      console.error(`[SOCIAL UPLOAD] Error uploading ${imageType} image:`, error);
      showNotification('error', `Network error: Failed to upload ${imageType} image. Check console for details.`);
      return null;
    } finally {
      console.log(`[SOCIAL UPLOAD] Upload process finished, resetting loading state`);
      const setUploading = imageType === 'og' ? setUploadingOgImage : setUploadingTwitterImage;
      setUploading(false);
    }
  };

  const handleSocialImageUpload = async (files: FileList, imageType: 'og' | 'twitter') => {
    const file = files[0];
    if (!file) return;

    const url = await uploadSocialImage(file, imageType);
    if (url) {
      const fieldName = imageType === 'og' ? 'openGraphImage' : 'twitterImage';
      handleInputChange(fieldName, url);
    }
  };

  const handleSocialImageInputChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'og' | 'twitter') => {
    if (e.target.files && e.target.files.length > 0) {
      handleSocialImageUpload(e.target.files, imageType);
    }
  };

  const handleSocialImageDrop = (e: React.DragEvent, imageType: 'og' | 'twitter') => {
    e.preventDefault();
    const setDragOver = imageType === 'og' ? setDragOverOgImage : setDragOverTwitterImage;
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSocialImageUpload(e.dataTransfer.files, imageType);
    }
  };

  const handleSocialImageDragOver = (e: React.DragEvent, imageType: 'og' | 'twitter') => {
    e.preventDefault();
    const setDragOver = imageType === 'og' ? setDragOverOgImage : setDragOverTwitterImage;
    setDragOver(true);
  };

  const handleSocialImageDragLeave = (e: React.DragEvent, imageType: 'og' | 'twitter') => {
    e.preventDefault();
    const setDragOver = imageType === 'og' ? setDragOverOgImage : setDragOverTwitterImage;
    setDragOver(false);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white font-medium">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-white" />
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-slate-400">Manage your site configuration</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* General Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">General Settings</h2>
          <div className="ml-auto">
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
              Site Metadata
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleInputChange('siteName', e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
              placeholder="Gemsutopia"
            />
            <p className="text-xs text-slate-500 mt-1">Appears in browser tab and internal site references</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Favicon</label>
            
            {/* Favicon Upload Area */}
            <div
              onDrop={handleFaviconDrop}
              onDragOver={handleFaviconDragOver}
              onDragLeave={handleFaviconDragLeave}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
                dragOverFavicon 
                  ? 'border-white bg-white/10' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <input
                type="file"
                accept=".ico,.png,.jpg,.jpeg,.gif,.svg,image/*"
                onChange={handleFaviconInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingFavicon}
              />
              
              <div className="pointer-events-none">
                {settings.siteFavicon ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                      <img 
                        src={settings.siteFavicon} 
                        alt="Current favicon" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="text-slate-400 text-xs">Invalid</div>';
                          }
                        }}
                      />
                    </div>
                    <div className="text-white text-sm font-medium">Current Favicon</div>
                    <div className="text-slate-400 text-xs truncate max-w-full">
                      {settings.siteFavicon.split('/').pop()}
                    </div>
                  </div>
                ) : (
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                )}
                
                {uploadingFavicon ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-sm">Uploading favicon...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white font-medium text-sm">{settings.siteFavicon ? 'Click or drag to replace favicon' : 'Click to browse or drag & drop favicon'}</p>
                    <p className="text-slate-400 text-xs">Supports .ico, .png, .jpg, .gif, .svg (max 1MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Manual URL Input (for advanced users) */}
            <details className="mb-2">
              <summary className="text-slate-400 text-xs cursor-pointer hover:text-white transition-colors">
                Advanced: Set favicon URL manually
              </summary>
              <input
                type="text"
                value={settings.siteFavicon}
                onChange={(e) => {
                  handleInputChange('siteFavicon', e.target.value);
                  // Update favicon immediately when manually changed
                  if (e.target.value) {
                    updateFaviconInDOM(e.target.value);
                  }
                }}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none mt-2 text-sm"
                placeholder="/favicon.ico or https://example.com/favicon.png"
              />
            </details>
            
            <p className="text-xs text-slate-500">Upload a favicon or enter a URL. Changes apply immediately.</p>
          </div>
        </div>

        {/* Site Preview */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Browser Tab Preview
          </h3>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-slate-600 rounded-sm flex items-center justify-center overflow-hidden">
                {settings.siteFavicon ? (
                  <img 
                    src={settings.siteFavicon} 
                    alt="Favicon preview" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '🌟';
                      }
                    }}
                  />
                ) : (
                  <span className="text-xs">🌟</span>
                )}
              </div>
              <span className="text-slate-300">
                {settings.siteName || 'Gemsutopia'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Browser tab preview with favicon
            </p>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">SEO Settings</h2>
          <div className="ml-auto">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
              Essential
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">SEO Title</label>
            <input
              type="text"
              value={settings.seoTitle}
              onChange={(e) => handleInputChange('seoTitle', e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
              placeholder="Gemsutopia - Premium Gemstone Collection"
            />
            <p className="text-xs text-slate-500 mt-1">Appears as the main title in Google search results (separate from browser tab title)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">SEO Description</label>
            <textarea
              value={settings.seoDescription}
              onChange={(e) => handleInputChange('seoDescription', e.target.value)}
              rows={3}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none resize-none"
              placeholder="Hi, I'm Reese, founder of Gemsutopia and proud Canadian gem dealer..."
            />
            <p className="text-xs text-slate-500 mt-1">Appears as the description snippet in Google search results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">SEO Keywords</label>
              <input
                type="text"
                value={settings.seoKeywords}
                onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                placeholder="gemstones, jewelry, natural stones, precious gems"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">SEO Author</label>
              <input
                type="text"
                value={settings.seoAuthor}
                onChange={(e) => handleInputChange('seoAuthor', e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                placeholder="Gemsutopia"
              />
            </div>
          </div>

          {/* Open Graph Settings */}
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-white font-medium mb-8 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Social Media Sharing
            </h3>
            
            <div className="space-y-10">
              {/* Titles Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Open Graph Title</label>
                  <input
                    type="text"
                    value={settings.openGraphTitle}
                    onChange={(e) => handleInputChange('openGraphTitle', e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                    placeholder="Leave empty to use SEO Title"
                  />
                  <p className="text-xs text-slate-500 mt-2">Used when shared on Facebook, LinkedIn, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Twitter Title</label>
                  <input
                    type="text"
                    value={settings.twitterTitle}
                    onChange={(e) => handleInputChange('twitterTitle', e.target.value)}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                    placeholder="Leave empty to use SEO Title"
                  />
                  <p className="text-xs text-slate-500 mt-2">Used when shared on Twitter/X</p>
                </div>
              </div>
              
              {/* Descriptions Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Open Graph Description</label>
                  <textarea
                    value={settings.openGraphDescription}
                    onChange={(e) => handleInputChange('openGraphDescription', e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none resize-none"
                    placeholder="Leave empty to use SEO Description"
                  />
                  <p className="text-xs text-slate-500 mt-2">Description for Facebook, LinkedIn shares</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Twitter Description</label>
                  <textarea
                    value={settings.twitterDescription}
                    onChange={(e) => handleInputChange('twitterDescription', e.target.value)}
                    rows={3}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none resize-none"
                    placeholder="Leave empty to use SEO Description"
                  />
                  <p className="text-xs text-slate-500 mt-2">Description for Twitter/X shares</p>
                </div>
              </div>

              {/* Images Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-4">Open Graph Image</label>
                  
                  {/* Open Graph Image Upload Area */}
                  <div
                    onDrop={(e) => handleSocialImageDrop(e, 'og')}
                    onDragOver={(e) => handleSocialImageDragOver(e, 'og')}
                    onDragLeave={(e) => handleSocialImageDragLeave(e, 'og')}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
                      dragOverOgImage 
                        ? 'border-white bg-white/10' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSocialImageInputChange(e, 'og')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingOgImage}
                    />
                    
                    <div className="pointer-events-none">
                      {settings.openGraphImage ? (
                        <div className="space-y-4">
                          <div className="w-32 h-32 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 overflow-hidden mx-auto p-2">
                            <img 
                              src={settings.openGraphImage} 
                              alt="Open Graph preview" 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="text-slate-400 text-xs">Invalid</div>';
                                }
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">Facebook/LinkedIn Image</div>
                            <div className="text-slate-400 text-xs truncate mt-1">
                              {settings.openGraphImage.split('/').pop()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon className="h-12 w-12 text-slate-400 mx-auto" />
                          <div className="text-slate-400 text-sm">No Facebook image set</div>
                        </div>
                      )}
                      
                      {uploadingOgImage ? (
                        <div className="mt-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                          <p className="text-white text-sm mt-2">Uploading...</p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm mt-4">
                          {settings.openGraphImage ? 'Click or drag to replace' : 'Click to browse or drag & drop image'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Manual URL Input */}
                  <details className="mb-3">
                    <summary className="text-slate-400 text-xs cursor-pointer hover:text-white transition-colors">
                      Advanced: Set image URL manually
                    </summary>
                    <input
                      type="url"
                      value={settings.openGraphImage}
                      onChange={(e) => handleInputChange('openGraphImage', e.target.value)}
                      className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none mt-2 text-sm"
                      placeholder="https://gemsutopia.ca/og-image.jpg"
                    />
                  </details>
                  <p className="text-xs text-slate-500">Recommended: 1200x630px for Facebook, LinkedIn</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-4">Twitter Image</label>
                  
                  {/* Twitter Image Upload Area */}
                  <div
                    onDrop={(e) => handleSocialImageDrop(e, 'twitter')}
                    onDragOver={(e) => handleSocialImageDragOver(e, 'twitter')}
                    onDragLeave={(e) => handleSocialImageDragLeave(e, 'twitter')}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
                      dragOverTwitterImage 
                        ? 'border-white bg-white/10' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSocialImageInputChange(e, 'twitter')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingTwitterImage}
                    />
                    
                    <div className="pointer-events-none">
                      {settings.twitterImage ? (
                        <div className="space-y-4">
                          <div className="w-32 h-32 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 overflow-hidden mx-auto p-2">
                            <img 
                              src={settings.twitterImage} 
                              alt="Twitter preview" 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="text-slate-400 text-xs">Invalid</div>';
                                }
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">Twitter/X Image</div>
                            <div className="text-slate-400 text-xs truncate mt-1">
                              {settings.twitterImage.split('/').pop()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon className="h-12 w-12 text-slate-400 mx-auto" />
                          <div className="text-slate-400 text-sm">No Twitter image set</div>
                        </div>
                      )}
                      
                      {uploadingTwitterImage ? (
                        <div className="mt-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                          <p className="text-white text-sm mt-2">Uploading...</p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm mt-4">
                          {settings.twitterImage ? 'Click or drag to replace' : 'Click to browse or drag & drop image'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Manual URL Input */}
                  <details className="mb-3">
                    <summary className="text-slate-400 text-xs cursor-pointer hover:text-white transition-colors">
                      Advanced: Set image URL manually
                    </summary>
                    <input
                      type="url"
                      value={settings.twitterImage}
                      onChange={(e) => handleInputChange('twitterImage', e.target.value)}
                      className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none mt-2 text-sm"
                      placeholder="https://gemsutopia.ca/twitter-image.jpg"
                    />
                  </details>
                  <p className="text-xs text-slate-500">Recommended: 1200x675px for Twitter/X</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Search Preview */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Google Search Preview
          </h3>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4">
            <div className="space-y-1">
              <div className="text-blue-400 text-lg hover:underline cursor-pointer">
                {settings.seoTitle || 'Gemsutopia - Premium Gemstone Collection'}
              </div>
              <div className="text-green-400 text-sm">gemsutopia.ca</div>
              <div className="text-slate-300 text-sm mt-1 line-clamp-2">
                {settings.seoDescription || 'Your meta description will appear here...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Codes */}
      <DiscountCodes />

      {/* Shipping Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Shipping Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Enable Shipping</h3>
              <p className="text-sm text-slate-400">Enable shipping for all products</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableShipping}
                onChange={(e) => handleInputChange('enableShipping', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">International Shipping</h3>
              <p className="text-sm text-slate-400">Allow orders from outside Canada</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.internationalShipping}
                onChange={(e) => handleInputChange('internationalShipping', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tax Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Tax Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Enable Taxes</h3>
              <p className="text-sm text-slate-400">Apply tax calculations to orders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableTaxes}
                onChange={(e) => handleInputChange('enableTaxes', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.enableTaxes && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.taxRate}
                onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                placeholder="13.00"
              />
              <p className="text-xs text-slate-500 mt-1">Current rate: {settings.taxRate}% (Ontario HST)</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Payment Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Stripe Payments</h3>
              <p className="text-sm text-slate-400">Accept credit cards via Stripe</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stripeEnabled}
                onChange={(e) => handleInputChange('stripeEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">PayPal Payments</h3>
              <p className="text-sm text-slate-400">Accept PayPal payments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.paypalEnabled}
                onChange={(e) => handleInputChange('paypalEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Cryptocurrency Payments</h3>
              <p className="text-sm text-slate-400">Accept Bitcoin, Ethereum, Solana</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cryptoEnabled}
                onChange={(e) => handleInputChange('cryptoEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Currency Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Base Currency</label>
            <select
              value={settings.baseCurrency}
              onChange={(e) => handleInputChange('baseCurrency', e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/40 focus:outline-none"
            >
              <option value="CAD">CAD (Canadian Dollar)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}