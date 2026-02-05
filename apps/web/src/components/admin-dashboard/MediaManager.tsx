'use client';
import { useState } from 'react';
import { IconPhoto, IconUpload, IconTrash, IconEye } from '@tabler/icons-react';
import MediaUpload from './MediaUpload';

export default function MediaManager() {
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleVideoChange = (url: string | null) => {
    setVideoUrl(url || '');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <IconPhoto size={32} className="text-white" />
        <div>
          <h1 className="text-2xl font-bold text-white">Media Manager</h1>
          <p className="text-slate-400">Upload and manage your media files</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-6 text-xl font-semibold text-white">Upload Media</h2>
        <MediaUpload
          images={[]}
          video_url=""
          featured_image_index={0}
          onImagesChange={handleImagesChange}
          onVideoChange={handleVideoChange}
          onFeaturedImageChange={() => {}}
          maxImages={12}
          folder="media"
          label="Upload Files"
          description="Upload images and videos for your site"
        />
      </div>

      {/* Media Library */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-6 text-xl font-semibold text-white">Media Library</h2>

        {images.length === 0 && !videoUrl ? (
          <div className="py-12 text-center">
            <IconPhoto size={48} className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-400">No media files uploaded yet</p>
            <p className="text-sm text-slate-500">Upload some files to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {images.map((img, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg bg-slate-800">
                <img src={img} alt={`Media ${index + 1}`} className="h-32 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30">
                    <IconEye size={16} className="text-white" />
                  </button>
                  <button className="rounded-full bg-red-500/20 p-2 transition-colors hover:bg-red-500/30">
                    <IconTrash size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            {videoUrl && (
              <div className="group relative overflow-hidden rounded-lg bg-slate-800">
                <div className="flex h-32 w-full items-center justify-center bg-purple-900/20">
                  <div className="text-center">
                    <IconUpload size={32} className="mx-auto mb-2 text-purple-400" />
                    <p className="text-sm text-purple-400">Video</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30">
                    <IconEye size={16} className="text-white" />
                  </button>
                  <button className="rounded-full bg-red-500/20 p-2 transition-colors hover:bg-red-500/30">
                    <IconTrash size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
