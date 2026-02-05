'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/RichTextEditor';

interface PageConfig {
  id: string;
  label: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
}

const PAGES: PageConfig[] = [
  {
    id: 'about',
    label: 'About',
    fields: [
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Page subtitle' },
      { key: 'paragraph_1', label: 'Paragraph 1', type: 'textarea', placeholder: 'Introduction paragraph' },
      { key: 'paragraph_2', label: 'Paragraph 2', type: 'textarea', placeholder: 'Second paragraph' },
      { key: 'paragraph_3', label: 'Paragraph 3', type: 'textarea', placeholder: 'Third paragraph' },
      { key: 'paragraph_4', label: 'Paragraph 4', type: 'textarea', placeholder: 'Closing paragraph' },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    fields: [
      { key: 'email_address', label: 'Support Email', type: 'text', placeholder: 'gemsutopia@gmail.com' },
      { key: 'response_time_value', label: 'Response Time', type: 'text', placeholder: '24 hours' },
      { key: 'faq_1_question', label: 'FAQ 1 Question', type: 'text' },
      { key: 'faq_1_answer', label: 'FAQ 1 Answer', type: 'textarea' },
      { key: 'faq_2_question', label: 'FAQ 2 Question', type: 'text' },
      { key: 'faq_2_answer', label: 'FAQ 2 Answer', type: 'textarea' },
      { key: 'faq_3_question', label: 'FAQ 3 Question', type: 'text' },
      { key: 'faq_3_answer', label: 'FAQ 3 Answer', type: 'textarea' },
      { key: 'faq_4_question', label: 'FAQ 4 Question', type: 'text' },
      { key: 'faq_4_answer', label: 'FAQ 4 Answer', type: 'textarea' },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping',
    fields: [
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Page subtitle' },
      { key: 'processing_time', label: 'Processing Time', type: 'text', placeholder: '1–2 business days' },
      { key: 'canada_time', label: 'Canada Delivery', type: 'text', placeholder: '3–15 business days' },
      { key: 'usa_time', label: 'USA Delivery', type: 'text', placeholder: '5–20 business days' },
      { key: 'international_note', label: 'International Note', type: 'textarea', placeholder: 'International shipping info' },
    ],
  },
  {
    id: 'returns',
    label: 'Returns',
    fields: [
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Page subtitle' },
      { key: 'intro', label: 'Intro Text', type: 'textarea', placeholder: 'Intro paragraph' },
      { key: 'policy', label: 'Return Policy', type: 'textarea' },
      { key: 'how_to_return', label: 'How to Return', type: 'textarea' },
      { key: 'exchanges', label: 'Exchanges', type: 'textarea' },
      { key: 'damaged_items', label: 'Damaged Items', type: 'textarea' },
      { key: 'non_returnable', label: 'Non-Returnable Items', type: 'textarea' },
    ],
  },
  {
    id: 'gem-guide',
    label: 'Gem Guide',
    fields: [
      { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Gem Guide' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Understanding nature\'s treasures' },
      { key: 'section_1_title', label: 'Section 1 Title', type: 'text' },
      { key: 'section_1_content', label: 'Section 1 Content', type: 'textarea' },
      { key: 'section_2_title', label: 'Section 2 Title', type: 'text' },
      { key: 'section_2_content', label: 'Section 2 Content', type: 'textarea' },
      { key: 'section_3_title', label: 'Section 3 Title', type: 'text' },
      { key: 'section_3_content', label: 'Section 3 Content', type: 'textarea' },
      { key: 'section_4_title', label: 'Section 4 Title', type: 'text' },
      { key: 'section_4_content', label: 'Section 4 Content', type: 'textarea' },
      { key: 'section_5_title', label: 'Section 5 Title', type: 'text' },
      { key: 'section_5_content', label: 'Section 5 Content', type: 'textarea' },
    ],
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    fields: [
      { key: 'title', label: 'Page Title', type: 'text', placeholder: 'How It Works' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'From earth to your collection' },
      { key: 'section_1_title', label: 'Section 1 Title', type: 'text' },
      { key: 'section_1_content', label: 'Section 1 Content', type: 'textarea' },
      { key: 'section_2_title', label: 'Section 2 Title', type: 'text' },
      { key: 'section_2_content', label: 'Section 2 Content', type: 'textarea' },
      { key: 'section_3_title', label: 'Section 3 Title', type: 'text' },
      { key: 'section_3_content', label: 'Section 3 Content', type: 'textarea' },
      { key: 'section_4_title', label: 'Section 4 Title', type: 'text' },
      { key: 'section_4_content', label: 'Section 4 Content', type: 'textarea' },
      { key: 'section_5_title', label: 'Section 5 Title', type: 'text' },
      { key: 'section_5_content', label: 'Section 5 Content', type: 'textarea' },
    ],
  },
  {
    id: 'sourcing',
    label: 'Ethical Sourcing',
    fields: [
      { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Ethical Sourcing' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Responsible practices, beautiful results' },
      { key: 'section_1_title', label: 'Section 1 Title', type: 'text' },
      { key: 'section_1_content', label: 'Section 1 Content', type: 'textarea' },
      { key: 'section_2_title', label: 'Section 2 Title', type: 'text' },
      { key: 'section_2_content', label: 'Section 2 Content', type: 'textarea' },
      { key: 'section_3_title', label: 'Section 3 Title', type: 'text' },
      { key: 'section_3_content', label: 'Section 3 Content', type: 'textarea' },
      { key: 'section_4_title', label: 'Section 4 Title', type: 'text' },
      { key: 'section_4_content', label: 'Section 4 Content', type: 'textarea' },
      { key: 'section_5_title', label: 'Section 5 Title', type: 'text' },
      { key: 'section_5_content', label: 'Section 5 Content', type: 'textarea' },
    ],
  },
  {
    id: 'care-guide',
    label: 'Care Guide',
    fields: [
      { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Care Guide' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Keeping your specimens pristine' },
      { key: 'section_1_title', label: 'Section 1 Title', type: 'text' },
      { key: 'section_1_content', label: 'Section 1 Content', type: 'textarea' },
      { key: 'section_2_title', label: 'Section 2 Title', type: 'text' },
      { key: 'section_2_content', label: 'Section 2 Content', type: 'textarea' },
      { key: 'section_3_title', label: 'Section 3 Title', type: 'text' },
      { key: 'section_3_content', label: 'Section 3 Content', type: 'textarea' },
      { key: 'section_4_title', label: 'Section 4 Title', type: 'text' },
      { key: 'section_4_content', label: 'Section 4 Content', type: 'textarea' },
      { key: 'section_5_title', label: 'Section 5 Title', type: 'text' },
      { key: 'section_5_content', label: 'Section 5 Content', type: 'textarea' },
    ],
  },
];

export default function PagesAdmin() {
  const [activeTab, setActiveTab] = useState(PAGES[0].id);
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPageContent = useCallback(async (section: string) => {
    try {
      const res = await fetch(`/api/pages/${section}`);
      if (res.ok) {
        const json = await res.json();
        setContent(prev => ({ ...prev, [section]: json.data || {} }));
      }
    } catch {
      // Silently fail - will use empty fields
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all(PAGES.map(p => fetchPageContent(p.id))).finally(() => setLoading(false));
  }, [fetchPageContent]);

  const handleFieldChange = (section: string, key: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      const fields = content[section] || {};
      const res = await fetch(`/api/pages/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (res.ok) {
        toast.success('Page saved successfully');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const activePage = PAGES.find(p => p.id === activeTab)!;
  const activeContent = content[activeTab] || {};

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
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <p className="mt-1 text-sm text-gray-500">Manage content for all information pages</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
        {PAGES.map(page => (
          <button
            key={page.id}
            onClick={() => setActiveTab(page.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === page.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Content editor */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{activePage.label}</h2>
          <button
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-4">
          {activePage.fields.map(field => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <RichTextEditor
                  value={activeContent[field.key] || ''}
                  onChange={val => handleFieldChange(activeTab, field.key, val)}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type="text"
                  value={activeContent[field.key] || ''}
                  onChange={e => handleFieldChange(activeTab, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
