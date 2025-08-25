'use client';
import { useState } from 'react';
import { ImageIcon, Upload, Trash2, Eye } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ImageIcon className="h-8 w-8 text-white" />
        <div>
          <h1 className="text-2xl font-bold text-white">Media Manager</h1>
          <p className="text-slate-400">Upload and manage your media files</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Upload Media</h2>
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
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Media Library</h2>
        
        {images.length === 0 && !videoUrl ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No media files uploaded yet</p>
            <p className="text-slate-500 text-sm">Upload some files to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group bg-slate-800 rounded-lg overflow-hidden">
                <img
                  src={img}
                  alt={`Media ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <Eye className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            
            {videoUrl && (
              <div className="relative group bg-slate-800 rounded-lg overflow-hidden">
                <div className="w-full h-32 flex items-center justify-center bg-purple-900/20">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-400 text-sm">Video</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <Eye className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-400" />
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