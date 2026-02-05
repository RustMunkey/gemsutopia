'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const SEO_FIELDS = [
  { key: 'site_title', label: 'Site Title', type: 'text', placeholder: 'Gemsutopia - Canadian Gemstone Shop', description: 'Appears in browser tab and search results' },
  { key: 'site_description', label: 'Site Description', type: 'textarea', placeholder: 'Premium hand-selected gemstones and minerals...', description: 'Meta description for search engines (150-160 chars ideal)' },
  { key: 'homepage_title', label: 'Homepage Tab Title', type: 'text', placeholder: 'Gemsutopia | Premium Canadian Gemstones', description: 'Browser tab title for homepage' },
  { key: 'homepage_description', label: 'Homepage Meta Description', type: 'textarea', placeholder: 'Shop premium hand-selected gemstones...', description: 'Search engine description for homepage' },
  { key: 'og_title', label: 'Open Graph Title', type: 'text', placeholder: 'Gemsutopia', description: 'Title shown when shared on social media' },
  { key: 'og_description', label: 'Open Graph Description', type: 'textarea', placeholder: 'Premium Canadian gemstones...', description: 'Description shown when shared on social media' },
  { key: 'og_image', label: 'Open Graph Image URL', type: 'text', placeholder: 'https://gemsutopia.ca/og-image.jpg', description: 'Image shown when shared on social media (1200x630px recommended)' },
  { key: 'twitter_handle', label: 'Twitter Handle', type: 'text', placeholder: '@gemsutopia_shop', description: 'Your Twitter/X handle for Twitter Cards' },
  { key: 'google_analytics_id', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX', description: 'Google Analytics measurement ID' },
  { key: 'google_search_console', label: 'Google Search Console Verification', type: 'text', placeholder: 'verification-code', description: 'HTML tag content for Search Console verification' },
  { key: 'canonical_url', label: 'Canonical URL', type: 'text', placeholder: 'https://gemsutopia.ca', description: 'Primary URL of your site' },
  { key: 'robots_txt', label: 'Custom Robots Rules', type: 'textarea', placeholder: 'User-agent: *\nAllow: /', description: 'Additional robots.txt directives' },
  { key: 'structured_data_org', label: 'Organization Name', type: 'text', placeholder: 'Gemsutopia', description: 'Organization name for structured data/schema.org' },
  { key: 'structured_data_logo', label: 'Organization Logo URL', type: 'text', placeholder: 'https://gemsutopia.ca/logo.png', description: 'Logo URL for structured data' },
];

export default function SEOPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/seo')
      .then(res => res.json())
      .then(json => {
        const data: Record<string, string> = {};
        if (json.data) {
          for (const [key, value] of Object.entries(json.data)) {
            try {
              data[key] = JSON.parse(value as string);
            } catch {
              data[key] = value as string;
            }
          }
        }
        setContent(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: content }),
      });
      if (res.ok) {
        toast.success('SEO settings saved');
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div><h1 className="text-2xl font-bold">SEO & Marketing</h1></div>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO & Marketing</h1>
          <p className="text-sm text-muted-foreground">Manage search engine optimization and analytics</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      {/* Meta Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta Tags & Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SEO_FIELDS.slice(0, 4).map(field => (
            <div key={field.key}>
              <Label className="text-sm">{field.label}</Label>
              <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
              {field.type === 'textarea' ? (
                <Textarea
                  value={content[field.key] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={2}
                />
              ) : (
                <Input
                  value={content[field.key] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              )}
              {field.key.includes('description') && content[field.key] && (
                <p className={`text-xs mt-1 ${(content[field.key]?.length || 0) > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {content[field.key]?.length || 0}/160 characters
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Social/OG */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Media & Open Graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SEO_FIELDS.slice(4, 8).map(field => (
            <div key={field.key}>
              <Label className="text-sm">{field.label}</Label>
              <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
              {field.type === 'textarea' ? (
                <Textarea
                  value={content[field.key] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={2}
                />
              ) : (
                <Input
                  value={content[field.key] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Analytics & Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analytics & Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SEO_FIELDS.slice(8, 10).map(field => (
            <div key={field.key}>
              <Label className="text-sm">{field.label}</Label>
              <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
              <Input
                value={content[field.key] || ''}
                onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced & Structured Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SEO_FIELDS.slice(10).map(field => (
            <div key={field.key}>
              <Label className="text-sm">{field.label}</Label>
              <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
              {field.type === 'textarea' ? (
                <Textarea
                  value={content[field.key] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  value={content[field.key] || ''}
                  onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
