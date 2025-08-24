'use client';
import { useState, useEffect, useCallback } from 'react';
import { Edit2, X, ImageIcon, Type, Code } from 'lucide-react';
import Image from 'next/image';
import { SiteContent } from '@/lib/types/database';
import StatsManager from './StatsManager';
import GemFactsManager from './GemFactsManager';
import FAQManager from './FAQManager';

export default function SiteContentManager() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SiteContent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/site-content', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const contentItems = [
    // About Section
    { section: 'about', key: 'section_title', label: 'About Title', type: 'text' },
    { section: 'about', key: 'section_content', label: 'About Content', type: 'html' },
    
    // Contact Info
    { section: 'contact', key: 'email', label: 'Contact Email', type: 'text' },
    { section: 'contact', key: 'phone', label: 'Phone Number', type: 'text' },
    { section: 'contact', key: 'address', label: 'Address', type: 'text' },
    
    // Marquee Settings
    { section: 'marquee', key: 'enabled', label: 'Enable Marquee', type: 'checkbox' },
    { section: 'marquee', key: 'text', label: 'Marquee Text', type: 'text' },
    { section: 'marquee', key: 'gradient_colors', label: 'Marquee Color', type: 'gradient' }
  ];

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getHeroImages = useCallback((): string[] => {
    const heroItem = content.find(c => c.section === 'hero' && c.key === 'images');
    if (heroItem?.value) {
      try {
        return JSON.parse(heroItem.value);
      } catch {
        return heroItem.value ? [heroItem.value] : [];
      }
    }
    return [];
  }, [content]);

  const updateHeroImages = async (images: string[]) => {
    try {
      const token = localStorage.getItem('admin-token');
      const heroItem = content.find(c => c.section === 'hero' && c.key === 'images');
      
      const payload = {
        value: JSON.stringify(images),
        is_active: true
      };

      let response;
      if (heroItem) {
        // Update existing
        response = await fetch(`/api/site-content/${heroItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        response = await fetch('/api/site-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            section: 'hero',
            key: 'images',
            content_type: 'json',
            ...payload
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        fetchContent();
        
        // Trigger a page refresh for hero section to update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cms-content-updated'));
        }
      } else {
        alert(data.message || 'Failed to update images');
      }
    } catch (error) {
      console.error('Error updating hero images:', error);
      alert('Failed to update images');
    }
  };

  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new HTMLImageElement();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              console.log(`Image resized: ${file.size} → ${blob.size} bytes (${Math.round(blob.size / file.size * 100)}%)`);
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      const token = localStorage.getItem('admin-token');
      if (!token) {
        alert('Not authenticated. Please log in again.');
        return null;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WebP images are supported');
        return null;
      }

      console.log(`Processing image: ${file.name} (${file.size} bytes)`);

      // Resize/compress large images
      let processedFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB
        console.log('Large image detected, resizing...');
        processedFile = await resizeImage(file, 1920, 1080, 0.8);
      }

      // Check if we can access Supabase URLs from client
      console.log('Environment check:', {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      });

      // Try server-side Supabase upload first (now working!)
      console.log('Attempting Supabase upload via API...');
      
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('folder', 'hero');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadData.success) {
        console.log('Supabase upload successful:', uploadData.url);
        return uploadData.url;
      } else {
        console.log('Server-side upload failed, trying client-side...', uploadData.message);
        
        // Fallback to client-side upload
        const { createClient } = await import('@supabase/supabase-js');
        
        // Use environment variables (now corrected)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Generate secure filename
        const fileExt = processedFile.name.split('.').pop()?.toLowerCase();
        const secureFileName = `hero/${Date.now()}-${Math.random().toString(36).substring(2, 12)}.${fileExt}`;
        
        console.log('Attempting client-side upload:', secureFileName, `(${processedFile.size} bytes)`);
        
        // Upload directly from browser to Supabase
        const { error } = await supabase.storage
          .from('product-images')
          .upload(secureFileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Client-side upload error:', error);
          alert(`Upload failed: ${error.message}`);
          return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(secureFileName);

        console.log('Client-side upload successful:', urlData.publicUrl);
        return urlData.publicUrl;
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network error: Unable to connect to upload service. Please check your internet connection.');
      } else {
        alert('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      alert('Please select only image files');
      return;
    }

    if (validFiles.length > 5) {
      alert('Maximum 5 images at once');
      return;
    }

    const currentImages = getHeroImages();
    const uploadedUrls: string[] = [];

    for (const file of validFiles) {
      const url = await uploadImageToSupabase(file);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      const updatedImages = [...currentImages, ...uploadedUrls];
      updateHeroImages(updatedImages);
    }
  };


  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeHeroImage = async (index: number) => {
    const currentImages = getHeroImages();
    const imageToRemove = currentImages[index];
    
    if (!imageToRemove) return;
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete this image?\n\n${imageToRemove.split('/').pop()}`)) {
      return;
    }
    
    console.log(`Removing image: ${imageToRemove}`);
    
    const updatedImages = currentImages.filter((_, i) => i !== index);
    await updateHeroImages(updatedImages);
    
    // Optional: Clean up the image file from Supabase (if it's a Supabase URL)
    if (imageToRemove.includes('supabase.co')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Extract file path from URL
        const urlParts = imageToRemove.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folderPath = urlParts.slice(-2, -1)[0]; // Get folder name (e.g., 'hero')
        const fullPath = `${folderPath}/${fileName}`;
        
        console.log(`Attempting to delete file from storage: ${fullPath}`);
        
        const { error } = await supabase.storage
          .from('product-images')
          .remove([fullPath]);
          
        if (error) {
          console.warn('Failed to delete file from storage:', error);
          // Don't show error to user since the image was removed from the CMS
        } else {
          console.log('File deleted from storage successfully');
        }
      } catch (error) {
        console.warn('Error during storage cleanup:', error);
      }
    }
  };

  useEffect(() => {
    getHeroImages();
  }, [content, getHeroImages]);

  const getContentValue = (section: string, key: string): string => {
    if (section === 'marquee' && key === 'gradient_colors') {
      // Combine the existing gradient_from and gradient_to values
      const gradientFrom = content.find(c => c.section === 'marquee' && c.key === 'gradient_from')?.value || '#9333ea';
      const gradientTo = content.find(c => c.section === 'marquee' && c.key === 'gradient_to')?.value || '#db2777';
      return `${gradientFrom},${gradientTo}`;
    }
    const item = content.find(c => c.section === section && c.key === key);
    return item?.value || '';
  };


  const getContentTypeIcon = (type: string): React.ComponentType<{ className?: string }> => {
    switch (type) {
      case 'text': return Type;
      case 'html': return Code;
      case 'image': return ImageIcon;
      default: return Type;
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
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-2">Site Content ✨</h1>
        <p className="text-slate-400">Edit your front page content - manage hero images, featured products, about section, and more</p>
      </div>

      <div className="space-y-6">
        {/* Hero Images Section */}
        <div className="bg-black rounded-2xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Hero Section Images</h3>
          <p className="text-slate-400 mb-6">Upload images for your homepage slider</p>
          
          {/* Drag & Drop Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver 
                ? 'border-white bg-white/10' 
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="pointer-events-none">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              {uploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-white">Uploading images...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-white font-medium">Click to browse or drag & drop images</p>
                  <p className="text-slate-400 text-sm">Supports JPG, PNG, WebP (max 5 files at once)</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Images */}
          {getHeroImages().length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-4">Current Images ({getHeroImages().length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getHeroImages().map((imageUrl, index) => (
                  <div key={index} className="relative group bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                    <div className="aspect-video bg-slate-700 overflow-hidden relative">
                      <Image
                        src={imageUrl}
                        alt={`Hero image ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        onLoad={() => console.log(`Image loaded: ${imageUrl}`)}
                        onError={(e) => {
                          console.error(`Failed to load image: ${imageUrl}`);
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,' + btoa(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
                              <rect width="100%" height="100%" fill="#374151"/>
                              <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-size="14" font-family="Arial">
                                Image failed to load
                              </text>
                              <text x="50%" y="65%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-size="10" font-family="Arial">
                                ${imageUrl.substring(0, 40)}...
                              </text>
                            </svg>
                          `);
                        }}
                      />
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => removeHeroImage(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      title="Delete this image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    {/* Image Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs text-white truncate">
                        Image {index + 1}
                      </div>
                      <div className="text-xs text-slate-300 truncate mt-1">
                        {imageUrl.split('/').pop()?.split('.')[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {getHeroImages().length === 0 && (
            <div className="mt-6 text-center py-8 text-slate-400 bg-white/5 rounded-lg border border-white/10">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No hero images yet</p>
              <p className="text-sm mt-1">Upload your first image above to get started</p>
            </div>
          )}
        </div>

        {/* Other Sections */}
        {['about', 'contact', 'marquee'].map((sectionId) => {
          const sectionItems = contentItems.filter(item => item.section === sectionId);
          const sectionTitles = {
            about: 'About Section',
            contact: 'Contact Information',
            marquee: 'Marquee Banner'
          };
          
          return (
            <div key={sectionId} className="bg-black rounded-2xl border border-white/20 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">{sectionTitles[sectionId as keyof typeof sectionTitles]}</h3>
              
              {sectionId === 'about' ? (
                <div className="space-y-6">
                  {/* About Section Text Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionItems.map((item) => {
                      const currentValue = getContentValue(item.section, item.key);
                      const ContentIcon = getContentTypeIcon(item.type);
                      
                      return (
                        <div key={`${item.section}-${item.key}`} className="bg-white/5 rounded-lg border border-white/10 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <ContentIcon className="h-4 w-4 text-slate-400" />
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{item.label}</p>
                            </div>
                            <button
                              onClick={() => setEditingItem({ 
                                id: content.find(c => c.section === item.section && c.key === item.key)?.id || '',
                                section: item.section,
                                key: item.key,
                                content_type: item.type as SiteContent['content_type'],
                                value: currentValue,
                                metadata: {},
                                is_active: true,
                                created_at: '',
                                updated_at: ''
                              })}
                              className="p-1 text-slate-400 hover:text-white"
                              title={`Edit ${item.label}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="text-sm text-slate-300 bg-black/20 rounded p-2 border border-white/5">
                            {currentValue || <span className="text-slate-500 italic">Not set</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Stats Management */}
                  <StatsManager />
                  
                  {/* Gem Facts Management */}
                  <GemFactsManager />
                  
                  {/* FAQ Management */}
                  <FAQManager />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionItems.filter(item => item.key !== 'gradient_colors').map((item) => {
                      const currentValue = getContentValue(item.section, item.key);
                      const ContentIcon = getContentTypeIcon(item.type);
                      
                      return (
                        <div key={`${item.section}-${item.key}`} className="bg-white/5 rounded-lg border border-white/10 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <ContentIcon className="h-4 w-4 text-slate-400" />
                            <div className="flex-1">
                              <p className="font-medium text-white text-sm">{item.label}</p>
                            </div>
                            <button
                              onClick={() => setEditingItem({ 
                                id: content.find(c => c.section === item.section && c.key === item.key)?.id || '',
                                section: item.section,
                                key: item.key,
                                content_type: item.type as SiteContent['content_type'],
                                value: currentValue,
                                metadata: {},
                                is_active: true,
                                created_at: '',
                                updated_at: ''
                              })}
                              className="p-1 text-slate-400 hover:text-white"
                              title={`Edit ${item.label}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="text-sm text-slate-300 bg-black/20 rounded p-2 border border-white/5">
                            {currentValue || <span className="text-slate-500 italic">Not set</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Full width gradient color card */}
                  {sectionItems.find(item => item.key === 'gradient_colors') && (() => {
                    const item = sectionItems.find(item => item.key === 'gradient_colors')!;
                    const currentValue = getContentValue(item.section, item.key);
                    const ContentIcon = getContentTypeIcon(item.type);
                    
                    return (
                      <div key={`${item.section}-${item.key}`} className="bg-white/5 rounded-lg border border-white/10 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <ContentIcon className="h-4 w-4 text-slate-400" />
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{item.label}</p>
                          </div>
                          <button
                            onClick={() => {
                              const existingItem = content.find(c => c.section === item.section && c.key === item.key);
                              setEditingItem({ 
                                id: existingItem?.id || '',
                                section: item.section,
                                key: item.key,
                                content_type: item.type as SiteContent['content_type'],
                                value: existingItem?.value || (item.type === 'checkbox' ? 'false' : ''),
                                metadata: {},
                                is_active: true,
                                created_at: '',
                                updated_at: ''
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                            title={`Edit ${item.label}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-sm text-slate-300 bg-black/20 rounded p-2 border border-white/5">
                          {currentValue || <span className="text-slate-500 italic">Not set</span>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingItem && (
        <EditContentModal
          content={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={fetchContent}
        />
      )}

      {showAddModal && (
        <AddContentModal
          onClose={() => setShowAddModal(false)}
          onSave={fetchContent}
        />
      )}
    </div>
  );
}

function EditContentModal({ content, onClose, onSave }: {
  content: SiteContent;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    value: content.value,
    is_active: content.is_active
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('admin-token');
      
      // Handle gradient colors specially - need to update both gradient_from and gradient_to
      if (content.section === 'marquee' && content.key === 'gradient_colors') {
        const colorValues = formData.value.split(',');
        const gradientFrom = colorValues[0] || '#9333ea';
        const gradientTo = colorValues[1] || colorValues[0] || '#db2777'; // Use same color if single color
        
        // Get existing content
        const existingResponse = await fetch('/api/site-content?section=marquee', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const existingData = await existingResponse.json();
        const fromItem = existingData.success ? existingData.content.find((c: any) => c.key === 'gradient_from') : null;
        const toItem = existingData.success ? existingData.content.find((c: any) => c.key === 'gradient_to') : null;
        
        // Update or create gradient_from
        if (fromItem) {
          await fetch(`/api/site-content/${fromItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ value: gradientFrom })
          });
        } else {
          await fetch('/api/site-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              section: 'marquee',
              key: 'gradient_from',
              content_type: 'color',
              value: gradientFrom,
              is_active: true
            })
          });
        }
        
        // Update or create gradient_to
        if (toItem) {
          await fetch(`/api/site-content/${toItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ value: gradientTo })
          });
        } else {
          await fetch('/api/site-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              section: 'marquee',
              key: 'gradient_to',
              content_type: 'color',
              value: gradientTo,
              is_active: true
            })
          });
        }
      } else {
        // Regular content update or create
        if (content.id) {
          // Update existing content
          const response = await fetch(`/api/site-content/${content.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
          });

          const data = await response.json();
          if (!data.success) {
            alert(data.message || 'Failed to update content');
            return;
          }
        } else {
          // Create new content
          const response = await fetch('/api/site-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              section: content.section,
              key: content.key,
              content_type: content.content_type,
              ...formData
            })
          });

          const data = await response.json();
          if (!data.success) {
            alert(data.message || 'Failed to create content');
            return;
          }
        }
      }
      
      onSave();
      onClose();
      
      // Trigger content refresh for live updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cms-content-updated'));
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-2xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Content</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-white mb-2">
              Editing: {content.section} - {content.key}
            </label>
            <p className="text-sm text-slate-400 mb-4">
              Content type: {content.content_type}
            </p>
          </div>

          <div>
            {content.content_type === 'html' ? (
              <textarea
                value={formData.value}
                onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                rows={4}
                placeholder="Enter your content here..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              />
            ) : content.content_type === 'image' ? (
              <input
                type="url"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              />
            ) : content.content_type === 'color' ? (
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                  className="w-16 h-10 rounded-lg border border-white/10 bg-white/5"
                />
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                  placeholder="#000000"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                />
              </div>
            ) : content.content_type === 'checkbox' ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="toggle-switch"
                    checked={formData.value === 'true'}
                    onChange={(e) => setFormData(prev => ({...prev, value: e.target.checked ? 'true' : 'false'}))}
                    className="sr-only"
                  />
                  <label
                    htmlFor="toggle-switch"
                    className={`flex items-center cursor-pointer relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.value === 'true' ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.value === 'true' ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </label>
                </div>
                <span className="text-white font-medium">
                  {formData.value === 'true' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ) : (content as any).content_type === 'gradient' ? (
              <div className="space-y-3">
                {(() => {
                  const colors = formData.value.split(',');
                  const isSingleColor = colors.length === 1 || colors[0] === colors[1];
                  
                  return (
                    <>
                      {/* Color Mode Toggle */}
                      <div className="flex items-center gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            const currentColor = colors[0] || '#9333ea';
                            setFormData(prev => ({...prev, value: currentColor}));
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSingleColor 
                              ? 'bg-white text-black' 
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          Single Color
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentColor = colors[0] || '#9333ea';
                            const endColor = colors[1] || '#db2777';
                            setFormData(prev => ({...prev, value: `${currentColor},${endColor}`}));
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            !isSingleColor 
                              ? 'bg-white text-black' 
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          Gradient
                        </button>
                      </div>

                      {/* Color Controls */}
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={colors[0] || '#9333ea'}
                          onChange={(e) => {
                            if (isSingleColor) {
                              setFormData(prev => ({...prev, value: e.target.value}));
                            } else {
                              const newValue = `${e.target.value},${colors[1] || '#db2777'}`;
                              setFormData(prev => ({...prev, value: newValue}));
                            }
                          }}
                          className="w-16 h-10 rounded-lg border border-white/10 bg-white/5"
                        />
                        <div className="flex-1">
                          <label className="text-sm text-slate-300">
                            {isSingleColor ? 'Color' : 'Start Color'}
                          </label>
                          <input
                            type="text"
                            value={colors[0] || '#9333ea'}
                            onChange={(e) => {
                              if (isSingleColor) {
                                setFormData(prev => ({...prev, value: e.target.value}));
                              } else {
                                const newValue = `${e.target.value},${colors[1] || '#db2777'}`;
                                setFormData(prev => ({...prev, value: newValue}));
                              }
                            }}
                            placeholder="#9333ea"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      {/* Second Color (only for gradient) */}
                      {!isSingleColor && (
                        <div className="flex gap-3 items-center">
                          <input
                            type="color"
                            value={colors[1] || '#db2777'}
                            onChange={(e) => {
                              const newValue = `${colors[0] || '#9333ea'},${e.target.value}`;
                              setFormData(prev => ({...prev, value: newValue}));
                            }}
                            className="w-16 h-10 rounded-lg border border-white/10 bg-white/5"
                          />
                          <div className="flex-1">
                            <label className="text-sm text-slate-300">End Color</label>
                            <input
                              type="text"
                              value={colors[1] || '#db2777'}
                              onChange={(e) => {
                                const newValue = `${colors[0] || '#9333ea'},${e.target.value}`;
                                setFormData(prev => ({...prev, value: newValue}));
                              }}
                              placeholder="#db2777"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div 
                        className="h-12 rounded-lg border border-white/10"
                        style={{
                          background: isSingleColor 
                            ? colors[0] || '#9333ea'
                            : `linear-gradient(to right, ${colors[0] || '#9333ea'}, ${colors[1] || '#db2777'})`
                        }}
                      />
                    </>
                  );
                })()}
              </div>
            ) : (
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                placeholder="Enter text here..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
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
              className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 disabled:bg-gray-400 text-black rounded-lg font-medium"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddContentModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    section: 'hero',
    key: '',
    content_type: 'text' as SiteContent['content_type'],
    value: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.value) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        onSave();
        onClose();
      } else {
        alert(data.message || 'Failed to create content');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-2xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New Content</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Section *
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData(prev => ({...prev, section: e.target.value}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white"
              >
                <option value="hero">Hero</option>
                <option value="featured">Featured</option>
                <option value="about">About</option>
                <option value="contact">Contact</option>
                <option value="marquee">Marquee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content Type *
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData(prev => ({...prev, content_type: e.target.value as SiteContent['content_type']}))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white"
              >
                <option value="text">Text</option>
                <option value="html">HTML</option>
                <option value="image">Image</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({...prev, key: e.target.value}))}
              placeholder="e.g., main_heading, subtitle, etc."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Value *
            </label>
            {formData.content_type === 'html' ? (
              <textarea
                value={formData.value}
                onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                rows={4}
                placeholder="Enter HTML content"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                required
              />
            ) : (
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({...prev, value: e.target.value}))}
                placeholder="Enter content value"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white"
                required
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="add_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
              className="rounded"
            />
            <label htmlFor="add_is_active" className="text-sm text-slate-300">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
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
              className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 disabled:bg-gray-400 text-black rounded-lg font-medium"
            >
              {loading ? 'Creating...' : 'Create Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



