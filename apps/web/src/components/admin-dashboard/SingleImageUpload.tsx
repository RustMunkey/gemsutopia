'use client';
import { useState, useRef, DragEvent } from 'react';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface SingleImageUploadProps {
  value: string;
  onChange: (imageUrl: string) => void;
  folder?: string;
  className?: string;
  label?: string;
  description?: string;
}

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
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

export default function SingleImageUpload({
  value,
  onChange,
  folder = 'categories',
  className = '',
  label = 'Category Image',
  description = 'Upload an image for this category',
}: SingleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);

      // Get admin token
      const token = localStorage.getItem('admin-token');
      if (!token) {
        toast.error('Authentication required. Please refresh the page and try again.');
        return;
      }

      // Resize image to reduce file size (max 800x600, 80% quality)
      const resizedFile = await resizeImage(file, 800, 600, 0.8);

      const formData = new FormData();
      formData.append('file', resizedFile);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.url) {
        onChange(result.url);
      } else {
        toast.error('Upload failed: ' + (result.message || result.error || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    await uploadImage(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    await handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-neutral-300">{label}</label>
      {description && <p className="mb-3 text-xs text-neutral-400">{description}</p>}

      {value ? (
        // Show uploaded image
        <div className="relative">
          <div className="relative h-32 w-full overflow-hidden rounded-lg bg-neutral-800">
            <Image src={value} alt="Category image" fill className="object-cover" sizes="400px" />
          </div>
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white transition-colors hover:bg-red-700"
          >
            <IconX size={12} />
          </button>
        </div>
      ) : (
        // Show upload area
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative h-32 w-full cursor-pointer rounded-lg border-2 border-dashed transition-all ${
            isDragOver
              ? 'border-white bg-neutral-800'
              : 'border-neutral-600 hover:border-neutral-500 hover:bg-neutral-800/50'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''} `}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
            {isUploading ? (
              <>
                <div className="mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-white"></div>
                <p className="text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <IconPhoto size={32} className="mb-2" />
                <p className="text-center text-sm">
                  <span className="text-white">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs">PNG, JPG up to 10MB</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={e => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
