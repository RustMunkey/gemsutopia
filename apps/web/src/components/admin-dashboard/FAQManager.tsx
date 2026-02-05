'use client';
import { useState, useEffect } from 'react';
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconHelpCircle,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export default function FAQManager() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/faq', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFaqItems(data);
      }
    } catch {
      // Error fetching FAQ
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (faqData: Partial<FAQItem>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const isEditing = editingFAQ !== null;

      const response = await fetch('/api/admin/faq', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...faqData,
          ...(isEditing && { id: editingFAQ.id }),
        }),
      });

      if (response.ok) {
        await fetchFAQ();
        setEditingFAQ(null);
        setShowAddModal(false);
        toast.success(isEditing ? 'FAQ updated' : 'FAQ created');
      } else {
        toast.error('Failed to save FAQ');
      }
    } catch {
      toast.error('Failed to save FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ item?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/faq?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchFAQ();
        toast.success('FAQ deleted');
      } else {
        toast.error('Failed to delete FAQ');
      }
    } catch {
      toast.error('Failed to delete FAQ');
    }
  };

  const toggleActive = async (faq: FAQItem) => {
    await handleSave({
      ...faq,
      is_active: !faq.is_active,
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="48" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-black p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">FAQ Management</h3>
          <p className="text-slate-400">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-100"
        >
          <IconPlus size={16} />
          Add FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqItems.map(faq => (
          <div key={faq.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                  <IconHelpCircle size={24} className="text-white" />
                </div>
              </div>

              <div className="flex-grow">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="font-medium text-white">{faq.question}</h4>
                  {!faq.is_active && (
                    <span className="rounded bg-red-400/10 px-2 py-1 text-xs text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mb-2 line-clamp-2 text-sm text-gray-400">{faq.answer}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Order: {faq.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(faq)}
                  className={`rounded-lg p-2 transition-colors ${
                    faq.is_active
                      ? 'text-green-400 hover:bg-green-400/10'
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={faq.is_active ? 'Active' : 'Inactive'}
                >
                  {faq.is_active ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                </button>

                <button
                  onClick={() => setEditingFAQ(faq)}
                  className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-400/10"
                  title="Edit"
                >
                  <IconPencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(faq.id)}
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-400/10"
                  title="Delete"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {faqItems.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <IconHelpCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No FAQ items yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingFAQ) && (
        <FAQModal
          faq={editingFAQ}
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            setEditingFAQ(null);
          }}
        />
      )}
    </div>
  );
}

interface FAQModalProps {
  faq: FAQItem | null;
  onSave: (data: Partial<FAQItem>) => void;
  onCancel: () => void;
}

function FAQModal({ faq, onSave, onCancel }: FAQModalProps) {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    sort_order: faq?.sort_order?.toString() || '0',
    is_active: faq?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      sort_order: parseInt(formData.sort_order) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-black p-6">
        <h3 className="mb-6 text-xl font-semibold text-white">{faq ? 'Edit FAQ' : 'Add FAQ'}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Question</label>
            <input
              type="text"
              value={formData.question}
              onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              placeholder="Enter your question here..."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">Answer</label>
            <textarea
              value={formData.answer}
              onChange={e => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              className="h-32 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              placeholder="Provide a detailed answer..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-white">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/20 px-6 py-2 text-white transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-2 text-black transition-colors hover:bg-gray-100"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
