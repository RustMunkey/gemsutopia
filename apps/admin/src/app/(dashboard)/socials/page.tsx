'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandX,
  IconBrandYoutube,
  IconBrandPatreon,
  IconDiamond,
  IconMail,
} from '@tabler/icons-react';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: IconBrandInstagram, placeholder: 'https://www.instagram.com/shop.gemsutopia/' },
  { key: 'tiktok', label: 'TikTok', icon: IconBrandTiktok, placeholder: 'https://www.tiktok.com/@gemsutopia.shop' },
  { key: 'youtube', label: 'YouTube', icon: IconBrandYoutube, placeholder: 'https://www.youtube.com/channel/...' },
  { key: 'twitter', label: 'X (Twitter)', icon: IconBrandX, placeholder: 'https://x.com/gemsutopia_shop' },
  { key: 'facebook_business', label: 'Facebook (Business)', icon: IconBrandFacebook, placeholder: 'https://www.facebook.com/gemsutopia' },
  { key: 'facebook_personal', label: 'Facebook (Personal)', icon: IconBrandFacebook, placeholder: 'https://www.facebook.com/...' },
  { key: 'patreon', label: 'Patreon', icon: IconBrandPatreon, placeholder: 'https://www.patreon.com/gemsutopia' },
  { key: 'gemrockauctions', label: 'Gem Rock Auctions', icon: IconDiamond, placeholder: 'https://www.gemrockauctions.com/shops/...' },
  { key: 'email', label: 'Email', icon: IconMail, placeholder: 'gemsutopia@gmail.com' },
];

export default function SocialsAdmin() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/pages/socials')
      .then(res => res.json())
      .then(json => {
        if (json.data) setContent(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pages/socials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: content }),
      });

      if (res.ok) {
        toast.success('Social links saved');
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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Social Links</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your social media links displayed on the website</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Platforms</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-4">
          {SOCIAL_FIELDS.map(field => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={content[field.key] || ''}
                    onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
