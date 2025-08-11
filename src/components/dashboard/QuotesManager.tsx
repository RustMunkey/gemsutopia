'use client';
import { useState, useEffect } from 'react';
import { Edit2, Plus, Trash2, Eye, EyeOff, Quote } from 'lucide-react';

interface QuoteItem {
  id: string;
  quote: string;
  author: string;
  gem_type: string;
  sort_order: number;
  is_active: boolean;
}

export default function QuotesManager() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (quoteData: Partial<QuoteItem>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const isEditing = editingQuote !== null;
      
      const response = await fetch('/api/admin/quotes', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...quoteData,
          ...(isEditing && { id: editingQuote.id })
        })
      });

      if (response.ok) {
        await fetchQuotes();
        setEditingQuote(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/quotes?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchQuotes();
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const toggleActive = async (quote: QuoteItem) => {
    await handleSave({
      ...quote,
      is_active: !quote.is_active
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
          <h3 className="text-xl font-semibold text-white">Quotes Management</h3>
          <p className="text-slate-400">Manage philosophical quotes about gemstones</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Quote
        </button>
      </div>

      <div className="space-y-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Quote className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-white font-medium line-clamp-2">&ldquo;{quote.quote}&rdquo;</p>
                  {!quote.is_active && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {quote.author && <span>Author: {quote.author}</span>}
                  {quote.gem_type && <span>Type: {quote.gem_type}</span>}
                  <span>Order: {quote.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(quote)}
                  className={`p-2 rounded-lg transition-colors ${
                    quote.is_active 
                      ? 'text-green-400 hover:bg-green-400/10' 
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={quote.is_active ? 'Active' : 'Inactive'}
                >
                  {quote.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => setEditingQuote(quote)}
                  className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(quote.id)}
                  className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {quotes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Quote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quotes yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingQuote) && (
        <QuoteModal
          quote={editingQuote}
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            setEditingQuote(null);
          }}
        />
      )}
    </div>
  );
}

interface QuoteModalProps {
  quote: QuoteItem | null;
  onSave: (data: Partial<QuoteItem>) => void;
  onCancel: () => void;
}

function QuoteModal({ quote, onSave, onCancel }: QuoteModalProps) {
  const [formData, setFormData] = useState({
    quote: quote?.quote || '',
    author: quote?.author || '',
    gem_type: quote?.gem_type || '',
    sort_order: quote?.sort_order?.toString() || '0',
    is_active: quote?.is_active ?? true
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
          {quote ? 'Edit Quote' : 'Add Quote'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Quote</label>
            <textarea
              value={formData.quote}
              onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white h-24"
              placeholder="Enter your philosophical quote here..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="Author name (optional)"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Gem Type</label>
              <input
                type="text"
                value={formData.gem_type}
                onChange={(e) => setFormData(prev => ({ ...prev, gem_type: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="e.g., Diamond, Ruby, General"
              />
            </div>
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