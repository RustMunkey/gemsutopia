'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconPhoto, IconUpload, IconTrash, IconCopy, IconSearch } from '@tabler/icons-react';

interface MediaItem {
  url: string;
  name: string;
  uploadedAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);
    const uploadPromises = Array.from(fileList).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          return { url: json.data?.url || json.url, name: file.name, uploadedAt: new Date().toISOString() };
        }
      } catch {}
      return null;
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(Boolean) as MediaItem[];

    if (successful.length > 0) {
      setFiles(prev => [...successful, ...prev]);
      toast.success(`${successful.length} file(s) uploaded`);
    } else {
      toast.error('Upload failed');
    }

    setUploading(false);
    e.target.value = '';
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleDelete = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('Removed from library');
  };

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media</h1>
          <p className="text-sm text-muted-foreground">Upload and manage images and videos</p>
        </div>
        <div>
          <input
            type="file"
            id="media-upload"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button size="sm" onClick={() => document.getElementById('media-upload')?.click()} disabled={uploading}>
            <IconUpload className="h-4 w-4 mr-1" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Drop Zone */}
      <Card className="border-dashed">
        <CardContent className="p-8">
          <div
            className="text-center cursor-pointer"
            onClick={() => document.getElementById('media-upload')?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-accent/50'); }}
            onDragLeave={e => { e.currentTarget.classList.remove('bg-accent/50'); }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-accent/50');
              const input = document.getElementById('media-upload') as HTMLInputElement;
              if (input && e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }}
          >
            <IconPhoto className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports: JPG, PNG, GIF, WebP, MP4
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((file, i) => (
            <div key={i} className="group relative rounded-lg border border-border overflow-hidden bg-muted/30">
              <div className="aspect-square relative cursor-pointer" onClick={() => setPreviewUrl(file.url)}>
                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{file.name}</p>
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => copyUrl(file.url)}>
                  <IconCopy className="h-3 w-3" />
                </Button>
                <Button variant="secondary" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(i)}>
                  <IconTrash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <IconPhoto className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No media files yet</p>
          <p className="text-xs mt-1">Upload images or videos to get started</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
