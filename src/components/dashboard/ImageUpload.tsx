'use client';
import { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  className?: string;
  label?: string;
  description?: string;
}

// Resize image to reduce file size
const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
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
        (blob) => {
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
  onImagesChange, 
  maxImages = 10, 
  folder = 'products',
  className = '',
  label = 'Images',
  description = 'Upload images (drag & drop or click to browse)'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Resize/compress large images
      let processedFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB
        console.log('Large image detected, resizing...');
        processedFile = await resizeImage(file, 1920, 1080, 0.8);
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
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadData.success) {
        return uploadData.url;
      } else {
        // Fallback to client-side upload
        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Generate secure filename
        const fileExt = processedFile.name.split('.').pop()?.toLowerCase();
        const secureFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 12)}.${fileExt}`;
        
        // Upload directly from browser to Supabase
        const { error } = await supabase.storage
          .from('product-images')
          .upload(secureFileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(error.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(secureFileName);

        return urlData.publicUrl;
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      alert('Please select only image files');
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (validFiles.length > remainingSlots) {
      alert(`Maximum ${maxImages} images allowed. You can add ${remainingSlots} more.`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of validFiles) {
      const url = await uploadImage(file);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
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
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      
      {/* Drag & Drop Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
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
          disabled={uploading || images.length >= maxImages}
        />
        
        <div className="pointer-events-none">
          <ImageIcon className="h-8 w-8 mx-auto mb-3 text-slate-400" />
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              <p className="text-white text-sm">Uploading images...</p>
            </div>
          ) : images.length >= maxImages ? (
            <div className="space-y-1">
              <p className="text-slate-400 text-sm">Maximum images reached ({maxImages})</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-white text-sm font-medium">Click to browse or drag & drop images</p>
              <p className="text-slate-400 text-xs">{description}</p>
              <p className="text-slate-500 text-xs">JPG, PNG, WebP • Max {maxImages} images</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <Image
                src={img}
                alt={`Image ${index + 1}`}
                width={80}
                height={80}
                className="w-full h-20 object-cover rounded-lg bg-slate-700"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}