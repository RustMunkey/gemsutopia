'use client';
import { useState, useEffect } from 'react';
import { Edit2, Plus, Trash2, Eye, EyeOff, HelpCircle } from 'lucide-react';

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
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaqItems(data);
      }
    } catch (error) {
      console.error('Error fetching FAQ:', error);
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...faqData,
          ...(isEditing && { id: editingFAQ.id })
        })
      });

      if (response.ok) {
        await fetchFAQ();
        setEditingFAQ(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ item?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/faq?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchFAQ();
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  const toggleActive = async (faq: FAQItem) => {
    await handleSave({
      ...faq,
      is_active: !faq.is_active
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-2xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">FAQ Management</h3>
          <p className="text-slate-400">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqItems.map((faq) => (
          <div key={faq.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-white font-medium">{faq.question}</h4>
                  {!faq.is_active && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{faq.answer}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Order: {faq.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(faq)}
                  className={`p-2 rounded-lg transition-colors ${
                    faq.is_active 
                      ? 'text-green-400 hover:bg-green-400/10' 
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={faq.is_active ? 'Active' : 'Inactive'}
                >
                  {faq.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => setEditingFAQ(faq)}
                  className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {faqItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
    is_active: faq?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      sort_order: parseInt(formData.sort_order) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-6">
          {faq ? 'Edit FAQ' : 'Add FAQ'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Question</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              placeholder="Enter your question here..."
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Answer</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white h-32"
              placeholder="Provide a detailed answer..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="is_active" className="text-white text-sm">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}