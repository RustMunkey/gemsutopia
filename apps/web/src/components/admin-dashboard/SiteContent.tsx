'use client';
import '../../styles/sitecontent.css';
import { useState, useEffect, useCallback } from 'react';
import { IconPencil, IconX, IconPhoto, IconTypography, IconCode } from '@tabler/icons-react';
import Image from 'next/image';
import { SiteContent } from '@/lib/types/database';
import StatsManager from './StatsManager';
import GemFactsManager from './GemFactsManager';
import FAQManager from './FAQManager';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

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
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setContent(data.content);
      }
    } catch {
      // Error fetching content
    } finally {
      setLoading(false);
    }
  };

  const contentItems = [
    // Featured Section
    { section: 'featured', key: 'section_title', label: 'Featured Title', type: 'text' },
    {
      section: 'featured',
      key: 'section_description',
      label: 'Featured Description',
      type: 'text',
    },

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
    { section: 'marquee', key: 'gradient_colors', label: 'Marquee Color', type: 'gradient' },
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
        is_active: true,
      };

      let response;
      if (heroItem) {
        // Update existing
        response = await fetch(`/api/site-content/${heroItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        response = await fetch('/api/site-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            section: 'hero',
            key: 'images',
            content_type: 'json',
            ...payload,
          }),
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
        toast.error(data.message || 'Failed to update images');
      }
    } catch {
      toast.error('Failed to update images');
    }
  };

  const resizeImage = (
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<File> => {
    return new Promise(resolve => {
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
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);

      const token = localStorage.getItem('admin-token');
      if (!token) {
        toast.error('Not authenticated. Please log in again.');
        return null;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are supported');
        return null;
      }

      // Resize/compress large images
      let processedFile = file;
      if (file.size > 1024 * 1024) {
        // If larger than 1MB
        processedFile = await resizeImage(file, 1920, 1080, 0.8);
      }

      // Upload via server-side API
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('folder', 'hero');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        return uploadData.url;
      } else {
        throw new Error(uploadData.message || 'Upload failed');
      }
    } catch (error) {

      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error(
          'Network error: Unable to connect to upload service. Please check your internet connection.'
        );
      } else {
        toast.error(
          'Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error')
        );
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast.error('Please select only image files');
      return;
    }

    if (validFiles.length > 5) {
      toast.error('Maximum 5 images at once');
      return;
    }

    const currentImages = getHeroImages();
    const uploadedUrls: string[] = [];

    for (const file of validFiles) {
      const url = await uploadImage(file);
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
    if (
      !confirm(`Are you sure you want to delete this image?\n\n${imageToRemove.split('/').pop()}`)
    ) {
      return;
    }

    const updatedImages = currentImages.filter((_, i) => i !== index);
    await updateHeroImages(updatedImages);

    // Optional: Clean up the image file from storage via API
    if (imageToRemove.includes('supabase.co')) {
      try {
        const token = localStorage.getItem('admin-token');
        const response = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: imageToRemove }),
        });

        // Storage cleanup attempt - ignore failures
      } catch {
        // Storage cleanup failed - continue
      }
    }
  };

  useEffect(() => {
    getHeroImages();
  }, [content, getHeroImages]);

  const getContentValue = (section: string, key: string): string => {
    if (section === 'marquee' && key === 'gradient_colors') {
      // Combine the existing gradient_from and gradient_to values
      const gradientFrom =
        content.find(c => c.section === 'marquee' && c.key === 'gradient_from')?.value || '#9333ea';
      const gradientTo =
        content.find(c => c.section === 'marquee' && c.key === 'gradient_to')?.value || '#db2777';
      return `${gradientFrom},${gradientTo}`;
    }
    const item = content.find(c => c.section === section && c.key === key);
    return item?.value || '';
  };

  const getContentTypeIcon = (
    type: string
  ): React.ComponentType<{ size?: number; className?: string }> => {
    switch (type) {
      case 'text':
        return IconTypography;
      case 'html':
        return IconCode;
      case 'image':
        return IconPhoto;
      default:
        return IconTypography;
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
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Site Content ✨</h1>
        <p className="text-slate-400">
          Edit your front page content - manage hero images, featured products, about section, and
          more
        </p>
      </div>

      <div className="space-y-6">
        {/* Hero Images Section */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">Hero Section Images</h3>
          <p className="mb-6 text-slate-400">Upload images for your homepage slider</p>

          {/* Drag & Drop Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? 'border-white bg-white/10' : 'border-white/20 hover:border-white/40'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={uploading}
            />

            <div className="pointer-events-none">
              <IconPhoto size={48} className="mx-auto mb-4 text-slate-400" />
              {uploading ? (
                <div className="space-y-2">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
                  <p className="text-white">Uploading images...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-white">Click to browse or drag & drop images</p>
                  <p className="text-sm text-slate-400">
                    Supports JPG, PNG, WebP (max 5 files at once)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Current Images */}
          {getHeroImages().length > 0 && (
            <div className="mt-6">
              <h4 className="mb-4 text-lg font-medium text-white">
                Current Images ({getHeroImages().length})
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getHeroImages().map((imageUrl, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-700">
                      <Image
                        src={imageUrl}
                        alt={`Hero image ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml;base64,' +
                            btoa(`
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
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 hover:bg-red-600"
                      title="Delete this image"
                    >
                      <IconX size={16} />
                    </button>

                    {/* Image Info Overlay */}
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="truncate text-xs text-white">Image {index + 1}</div>
                      <div className="mt-1 truncate text-xs text-slate-300">
                        {imageUrl.split('/').pop()?.split('.')[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {getHeroImages().length === 0 && (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 py-8 text-center text-slate-400">
              <IconPhoto size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg">No hero images yet</p>
              <p className="mt-1 text-sm">Upload your first image above to get started</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">Statistics</h3>
          <StatsManager />
        </div>

        {/* About Section - Content Only */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">About Section</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {contentItems
              .filter(item => item.section === 'about')
              .map(item => {
                const currentValue = getContentValue(item.section, item.key);
                const ContentIcon = getContentTypeIcon(item.type);

                return (
                  <div
                    key={`${item.section}-${item.key}`}
                    className="rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <ContentIcon size={16} className="text-slate-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.label}</p>
                      </div>
                      <button
                        onClick={() =>
                          setEditingItem({
                            id:
                              content.find(c => c.section === item.section && c.key === item.key)
                                ?.id || '',
                            section: item.section,
                            key: item.key,
                            content_type: item.type as SiteContent['content_type'],
                            value: currentValue,
                            metadata: {},
                            is_active: true,
                            created_at: '',
                            updated_at: '',
                          })
                        }
                        className="p-1 text-slate-400 hover:text-white"
                        title={`Edit ${item.label}`}
                      >
                        <IconPencil size={16} />
                      </button>
                    </div>

                    <div className="rounded border border-white/5 bg-black/20 p-2 text-sm text-slate-300">
                      {currentValue || <span className="text-slate-500 italic">Not set</span>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Gem Facts Section */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">Gem Facts</h3>
          <GemFactsManager />
        </div>

        {/* FAQ Section */}
        <div className="rounded-2xl border border-white/20 bg-black p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">FAQ Section</h3>
          <FAQManager />
        </div>

        {/* Other Sections */}
        {['featured', 'contact', 'marquee'].map(sectionId => {
          const sectionItems = contentItems.filter(item => item.section === sectionId);
          const sectionTitles = {
            featured: 'Featured Section',
            contact: 'Contact Information',
            marquee: 'Marquee Banner',
          };

          return (
            <div key={sectionId} className="rounded-2xl border border-white/20 bg-black p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">
                {sectionTitles[sectionId as keyof typeof sectionTitles]}
              </h3>

              {sectionId === 'featured' ? (
                <div className="space-y-6">
                  {/* Featured Section Text Content */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {sectionItems.map(item => {
                      const currentValue = getContentValue(item.section, item.key);
                      const ContentIcon = getContentTypeIcon(item.type);

                      return (
                        <div
                          key={`${item.section}-${item.key}`}
                          className="rounded-lg border border-white/10 bg-white/5 p-4"
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <ContentIcon size={16} className="text-slate-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{item.label}</p>
                            </div>
                            <button
                              onClick={() =>
                                setEditingItem({
                                  id:
                                    content.find(
                                      c => c.section === item.section && c.key === item.key
                                    )?.id || '',
                                  section: item.section,
                                  key: item.key,
                                  content_type: item.type as SiteContent['content_type'],
                                  value: currentValue,
                                  metadata: {},
                                  is_active: true,
                                  created_at: '',
                                  updated_at: '',
                                })
                              }
                              className="p-1 text-slate-400 hover:text-white"
                              title={`Edit ${item.label}`}
                            >
                              <IconPencil size={16} />
                            </button>
                          </div>

                          <div className="rounded border border-white/5 bg-black/20 p-2 text-sm text-slate-300">
                            {currentValue || <span className="text-slate-500 italic">Not set</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {sectionItems
                      .filter(item => item.key !== 'gradient_colors')
                      .map(item => {
                        const currentValue = getContentValue(item.section, item.key);
                        const ContentIcon = getContentTypeIcon(item.type);

                        return (
                          <div
                            key={`${item.section}-${item.key}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-4"
                          >
                            <div className="mb-3 flex items-center gap-3">
                              <ContentIcon size={16} className="text-slate-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.label}</p>
                              </div>
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    id:
                                      content.find(
                                        c => c.section === item.section && c.key === item.key
                                      )?.id || '',
                                    section: item.section,
                                    key: item.key,
                                    content_type: item.type as SiteContent['content_type'],
                                    value: currentValue,
                                    metadata: {},
                                    is_active: true,
                                    created_at: '',
                                    updated_at: '',
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-white"
                                title={`Edit ${item.label}`}
                              >
                                <IconPencil size={16} />
                              </button>
                            </div>

                            <div className="rounded border border-white/5 bg-black/20 p-2 text-sm text-slate-300">
                              {currentValue || (
                                <span className="text-slate-500 italic">Not set</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Full width gradient color card */}
                  {sectionItems.find(item => item.key === 'gradient_colors') &&
                    (() => {
                      const item = sectionItems.find(item => item.key === 'gradient_colors')!;
                      const currentValue = getContentValue(item.section, item.key);
                      const ContentIcon = getContentTypeIcon(item.type);

                      return (
                        <div
                          key={`${item.section}-${item.key}`}
                          className="rounded-lg border border-white/10 bg-white/5 p-4"
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <ContentIcon size={16} className="text-slate-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{item.label}</p>
                            </div>
                            <button
                              onClick={() => {
                                const existingItem = content.find(
                                  c => c.section === item.section && c.key === item.key
                                );
                                setEditingItem({
                                  id: existingItem?.id || '',
                                  section: item.section,
                                  key: item.key,
                                  content_type: item.type as SiteContent['content_type'],
                                  value:
                                    existingItem?.value ||
                                    (item.type === 'checkbox' ? 'false' : ''),
                                  metadata: {},
                                  is_active: true,
                                  created_at: '',
                                  updated_at: '',
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                              title={`Edit ${item.label}`}
                            >
                              <IconPencil size={16} />
                            </button>
                          </div>

                          <div className="rounded border border-white/5 bg-black/20 p-2 text-sm text-slate-300">
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
        <AddContentModal onClose={() => setShowAddModal(false)} onSave={fetchContent} />
      )}
    </div>
  );
}

function EditContentModal({
  content,
  onClose,
  onSave,
}: {
  content: SiteContent;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    value: content.value,
    is_active: content.is_active,
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
          headers: { Authorization: `Bearer ${token}` },
        });
        const existingData = await existingResponse.json();
        const fromItem = existingData.success
          ? existingData.content.find((c: any) => c.key === 'gradient_from')
          : null;
        const toItem = existingData.success
          ? existingData.content.find((c: any) => c.key === 'gradient_to')
          : null;

        // Update or create gradient_from
        if (fromItem) {
          await fetch(`/api/site-content/${fromItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: gradientFrom }),
          });
        } else {
          await fetch('/api/site-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              section: 'marquee',
              key: 'gradient_from',
              content_type: 'color',
              value: gradientFrom,
              is_active: true,
            }),
          });
        }

        // Update or create gradient_to
        if (toItem) {
          await fetch(`/api/site-content/${toItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: gradientTo }),
          });
        } else {
          await fetch('/api/site-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              section: 'marquee',
              key: 'gradient_to',
              content_type: 'color',
              value: gradientTo,
              is_active: true,
            }),
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
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });

          const data = await response.json();
          if (!data.success) {
            toast.error(data.message || 'Failed to update content');
            return;
          }
        } else {
          // Create new content
          const response = await fetch('/api/site-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              section: content.section,
              key: content.key,
              content_type: content.content_type,
              ...formData,
            }),
          });

          const data = await response.json();
          if (!data.success) {
            toast.error(data.message || 'Failed to create content');
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
    } catch {
      toast.error('Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Content</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-lg font-medium text-white">
              Editing: {content.section} - {content.key}
            </label>
            <p className="mb-4 text-sm text-slate-400">Content type: {content.content_type}</p>
          </div>

          <div>
            {content.content_type === 'html' ? (
              <textarea
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                rows={4}
                placeholder="Enter your content here..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              />
            ) : content.content_type === 'image' ? (
              <input
                type="url"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              />
            ) : content.content_type === 'color' ? (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.value}
                  onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="h-10 w-16 rounded-lg border border-white/10 bg-white/5"
                />
                <input
                  type="text"
                  value={formData.value}
                  onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                />
              </div>
            ) : content.content_type === 'checkbox' ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="toggle-switch"
                    checked={formData.value === 'true'}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, value: e.target.checked ? 'true' : 'false' }))
                    }
                    className="sr-only"
                  />
                  <label
                    htmlFor="toggle-switch"
                    className={`relative flex h-6 w-12 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                      formData.value === 'true' ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                        formData.value === 'true' ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </label>
                </div>
                <span className="font-medium text-white">
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
                      <div className="mb-4 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const currentColor = colors[0] || '#9333ea';
                            setFormData(prev => ({ ...prev, value: currentColor }));
                          }}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                            setFormData(prev => ({
                              ...prev,
                              value: `${currentColor},${endColor}`,
                            }));
                          }}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            !isSingleColor
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          Gradient
                        </button>
                      </div>

                      {/* Color Controls */}
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colors[0] || '#9333ea'}
                          onChange={e => {
                            if (isSingleColor) {
                              setFormData(prev => ({ ...prev, value: e.target.value }));
                            } else {
                              const newValue = `${e.target.value},${colors[1] || '#db2777'}`;
                              setFormData(prev => ({ ...prev, value: newValue }));
                            }
                          }}
                          className="h-10 w-16 rounded-lg border border-white/10 bg-white/5"
                        />
                        <div className="flex-1">
                          <label className="text-sm text-slate-300">
                            {isSingleColor ? 'Color' : 'Start Color'}
                          </label>
                          <input
                            type="text"
                            value={colors[0] || '#9333ea'}
                            onChange={e => {
                              if (isSingleColor) {
                                setFormData(prev => ({ ...prev, value: e.target.value }));
                              } else {
                                const newValue = `${e.target.value},${colors[1] || '#db2777'}`;
                                setFormData(prev => ({ ...prev, value: newValue }));
                              }
                            }}
                            placeholder="#9333ea"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Second Color (only for gradient) */}
                      {!isSingleColor && (
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={colors[1] || '#db2777'}
                            onChange={e => {
                              const newValue = `${colors[0] || '#9333ea'},${e.target.value}`;
                              setFormData(prev => ({ ...prev, value: newValue }));
                            }}
                            className="h-10 w-16 rounded-lg border border-white/10 bg-white/5"
                          />
                          <div className="flex-1">
                            <label className="text-sm text-slate-300">End Color</label>
                            <input
                              type="text"
                              value={colors[1] || '#db2777'}
                              onChange={e => {
                                const newValue = `${colors[0] || '#9333ea'},${e.target.value}`;
                                setFormData(prev => ({ ...prev, value: newValue }));
                              }}
                              placeholder="#db2777"
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div
                        className="gradient-preview h-12 rounded-lg border border-white/10"
                        style={
                          {
                            '--gradient-bg': isSingleColor
                              ? colors[0] || '#9333ea'
                              : `linear-gradient(to right, ${colors[0] || '#9333ea'}, ${colors[1] || '#db2777'})`,
                          } as React.CSSProperties
                        }
                      />
                    </>
                  );
                })()}
              </div>
            ) : (
              <input
                type="text"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Enter text here..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
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
              className="flex-1 rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddContentModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    section: 'hero',
    key: '',
    content_type: 'text' as SiteContent['content_type'],
    value: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        onSave();
        onClose();
      } else {
        toast.error(data.message || 'Failed to create content');
      }
    } catch {
      toast.error('Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add New Content</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Section *</label>
              <select
                value={formData.section}
                onChange={e => setFormData(prev => ({ ...prev, section: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="hero">Hero</option>
                <option value="featured">Featured</option>
                <option value="about">About</option>
                <option value="contact">Contact</option>
                <option value="marquee">Marquee</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Content Type *
              </label>
              <select
                value={formData.content_type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    content_type: e.target.value as SiteContent['content_type'],
                  }))
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="html">HTML</option>
                <option value="image">Image</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={e => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="e.g., main_heading, subtitle, etc."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Value *</label>
            {formData.content_type === 'html' ? (
              <textarea
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                rows={4}
                placeholder="Enter HTML content"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                required
              />
            ) : (
              <input
                type="text"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Enter content value"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:border-white focus:outline-none"
                required
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="add_is_active"
              checked={formData.is_active}
              onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
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
              className="flex-1 rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
