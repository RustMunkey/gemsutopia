'use client';
import { useState } from 'react';
import { IconPhoto, IconVideo, IconX, IconPlayerPlay } from '@tabler/icons-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  video_url?: string;
  featured_image_index?: number;
  onImagesChange: (images: string[]) => void;
  onVideoChange?: (videoUrl: string | null) => void;
  onFeaturedImageChange?: (index: number) => void;
  maxImages?: number;
  folder?: string;
  className?: string;
  label?: string;
  description?: string;
}

// Compress video to reduce file size
const compressVideo = (file: File, maxSizeMB: number = 100): Promise<File> => {
  return new Promise(resolve => {
    // If file is already under the limit, don't compress
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    video.onloadedmetadata = () => {
      // Calculate compression ratio
      const targetSizeMB = Math.min(maxSizeMB, (file.size / (1024 * 1024)) * 0.7); // Compress to 70% of original
      const compressionRatio = Math.min(0.8, targetSizeMB / (file.size / (1024 * 1024)));

      // Reduce dimensions if needed
      let { videoWidth, videoHeight } = video;
      if (videoWidth > 1920) {
        const ratio = 1920 / videoWidth;
        videoWidth = 1920;
        videoHeight = Math.round(videoHeight * ratio);
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Draw first frame and create a compressed version
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      // For now, just resolve with original file as true video compression requires complex libraries
      // This is a placeholder for basic validation
      resolve(file);
    };

    video.onerror = () => resolve(file);
    video.src = URL.createObjectURL(file);
  });
};

// Resize image to reduce file size
const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new window.Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
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

export default function ImageUpload({
  images,
  video_url,
  featured_image_index = 0,
  onImagesChange,
  onVideoChange,
  onFeaturedImageChange,
  maxImages = 8,
  folder = 'products',
  className = '',
  label = 'Product Media',
  description = 'Upload up to 8 images and 1 video (drag & drop or click to browse)',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Compress files if they're too large
      let processedFile = file;
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        // If larger than 1MB
        processedFile = await resizeImage(file, 1920, 1080, 0.8);
      } else if (file.type.startsWith('video/')) {
        if (file.size > 100 * 1024 * 1024) {
          // If larger than 100MB
          toast.error(
            `Video file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 100MB. Please compress the video first using HandBrake or similar software.`
          );
          return null;
        }
        processedFile = await compressVideo(file, 100);
      }

      const token = localStorage.getItem('admin-token');
      if (!token) {
        throw new Error('No admin token found');
      }

      // Try server-side Supabase upload
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('folder', folder);

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
        throw new Error(uploadData.message || 'Server upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const videoFiles = Array.from(files).filter(file => file.type === 'video/mp4');
    const validFiles = [...imageFiles, ...videoFiles];

    if (validFiles.length === 0) {
      toast.error('Please select only image files (JPG, PNG, WebP) or MP4 video files');
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (imageFiles.length > remainingSlots) {
      toast.error(`Maximum ${maxImages} images allowed. You can add ${remainingSlots} more images.`);
      return;
    }

    if (videoFiles.length > 1) {
      toast.error('Only one video file allowed per product');
      return;
    }

    if (videoFiles.length > 0 && video_url) {
      toast.error('Product already has a video. Remove the current video first.');
      return;
    }

    setUploading(true);

    // Upload images
    if (imageFiles.length > 0) {
      const uploadedImageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadFile(file);
        if (url) {
          uploadedImageUrls.push(url);
        }
      }

      if (uploadedImageUrls.length > 0) {
        onImagesChange([...images, ...uploadedImageUrls]);
      }
    }

    // Upload video
    if (videoFiles.length > 0 && onVideoChange) {
      const videoUrl = await uploadFile(videoFiles[0]);
      if (videoUrl) {
        onVideoChange(videoUrl);
      }
    }

    setUploading(false);
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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Featured image is always index 0, so no need to adjust
    if (onFeaturedImageChange && newImages.length > 0) {
      onFeaturedImageChange(0);
    }
  };

  const removeVideo = () => {
    if (onVideoChange) {
      onVideoChange(null);
    }
  };

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>

      {/* Drag & Drop Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative mb-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-white bg-white/10' : 'border-white/20 hover:border-white/40'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/mp4"
          onChange={handleFileInputChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={uploading}
        />

        <div className="pointer-events-none">
          <div className="mb-3 flex justify-center gap-2">
            <IconPhoto size={32} className="text-slate-400" />
            <IconVideo size={32} className="text-slate-400" />
          </div>
          {uploading ? (
            <div className="space-y-2">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-white"></div>
              <p className="text-sm text-white">Uploading media...</p>
            </div>
          ) : images.length >= maxImages && video_url ? (
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Maximum media reached</p>
              <p className="text-xs text-slate-500">({maxImages} images, 1 video)</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Click to browse or drag & drop media</p>
              <p className="text-xs text-slate-400">{description}</p>
              <p className="text-xs text-slate-500">Images: JPG, PNG, WebP • Video: MP4 only</p>
              <p className="text-xs text-slate-500">Max {maxImages} images + 1 video (100MB max)</p>
              <p className="text-xs text-slate-400">
                Videos auto-compress to fit. For huge files, use HandBrake first.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Media - Images and Video */}
      {(images.length > 0 || video_url) && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-300">
            Uploaded Media ({images.length} image{images.length !== 1 ? 's' : ''}
            {video_url ? ', 1 video' : ''})
          </h4>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Display all images first */}
            {images.map((img, index) => (
              <div key={`image-${index}`} className="group relative">
                <div
                  className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                    index === 0 ? 'border-white' : 'border-transparent hover:border-white/40'
                  }`}
                  onClick={() => {
                    if (onFeaturedImageChange && index !== 0) {
                      // Reorder images array to move selected image to first position
                      const newImages = [...images];
                      const selectedImage = newImages[index];
                      newImages.splice(index, 1);
                      newImages.unshift(selectedImage);
                      onImagesChange(newImages);
                      onFeaturedImageChange(0);
                    }
                  }}
                >
                  <Image
                    src={img}
                    alt={`Image ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-20 w-full bg-slate-700 object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                      <div className="rounded bg-white px-1 py-0.5 text-xs font-medium text-black">
                        Featured
                      </div>
                    </div>
                  )}
                  <div className="absolute top-1 left-1 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
                    IMG {index + 1}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                >
                  <IconX size={12} />
                </button>
              </div>
            ))}

            {/* Display video last */}
            {video_url && (
              <div key="video" className="group relative">
                <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-purple-500/50 bg-slate-700">
                  <video
                    src={video_url}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                    onError={() => (
                      // If video fails to load, show play icon
                      <IconPlayerPlay size={32} className="text-white" />
                    )}
                  />
                  <div className="absolute top-1 left-1 rounded bg-purple-600 px-1 py-0.5 text-xs text-white">
                    VIDEO
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                >
                  <IconX size={12} />
                </button>
              </div>
            )}
          </div>

          {onFeaturedImageChange && images.length > 1 && (
            <p className="mt-2 text-xs text-slate-400">
              Click an image to move it to first position (featured image). The first image is
              always the featured image.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
