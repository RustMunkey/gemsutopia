'use client';
import { useState, useEffect } from 'react';
import { Edit2, Plus, Trash2, Eye, EyeOff, Gem } from 'lucide-react';

interface GemFact {
  id: string;
  fact: string;
  gem_type: string;
  source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function GemFactsManager() {
  const [gemFacts, setGemFacts] = useState<GemFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFact, setEditingFact] = useState<GemFact | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchGemFacts();
  }, []);

  const fetchGemFacts = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/gem-facts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGemFacts(data);
      }
    } catch (error) {
      console.error('Error fetching gem facts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (factData: Partial<GemFact>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const isEditing = editingFact !== null;
      
      const response = await fetch('/api/admin/gem-facts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...factData,
          ...(isEditing && { id: editingFact.id })
        })
      });

      if (response.ok) {
        await fetchGemFacts();
        setEditingFact(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving gem fact:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gem fact?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/gem-facts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchGemFacts();
      }
    } catch (error) {
      console.error('Error deleting gem fact:', error);
    }
  };

  const toggleActive = async (fact: GemFact) => {
    await handleSave({
      ...fact,
      is_active: !fact.is_active
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
          <h3 className="text-xl font-semibold text-white">Gem Facts</h3>
          <p className="text-slate-400">Manage fascinating gem facts displayed on your website</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Fact
        </button>
      </div>

      <div className="space-y-4">
        {gemFacts.map((fact) => (
          <div key={fact.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Gem className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  {fact.gem_type && (
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                      {fact.gem_type}
                    </span>
                  )}
                  {!fact.is_active && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-white text-sm mb-2 leading-relaxed">{fact.fact}</p>
                {fact.source && (
                  <p className="text-gray-400 text-xs">Source: {fact.source}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(fact)}
                  className={`p-2 rounded-lg transition-colors ${
                    fact.is_active 
                      ? 'text-green-400 hover:bg-green-400/10' 
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={fact.is_active ? 'Active' : 'Inactive'}
                >
                  {fact.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => setEditingFact(fact)}
                  className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(fact.id)}
                  className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {gemFacts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Gem className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No gem facts yet. Add your first fascinating gem fact!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingFact) && (
        <GemFactModal
          fact={editingFact}
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            setEditingFact(null);
          }}
        />
      )}
    </div>
  );
}

interface GemFactModalProps {
  fact: GemFact | null;
  onSave: (data: Partial<GemFact>) => void;
  onCancel: () => void;
}

function GemFactModal({ fact, onSave, onCancel }: GemFactModalProps) {
  const [formData, setFormData] = useState({
    fact: fact?.fact || '',
    gem_type: fact?.gem_type || '',
    source: fact?.source || '',
    is_active: fact?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const gemTypes = [
    'Diamond', 'Emerald', 'Ruby', 'Sapphire', 'Pearl', 'Opal', 'Amethyst', 
    'Tanzanite', 'Jade', 'Garnet', 'Turquoise', 'Moonstone', 'Peridot', 
    'Aquamarine', 'Topaz', 'Citrine', 'Labradorite', 'General'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-6">
          {fact ? 'Edit Gem Fact' : 'Add Gem Fact'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Gem Fact *</label>
            <textarea
              value={formData.fact}
              onChange={(e) => setFormData(prev => ({ ...prev, fact: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white h-24"
              placeholder="Enter a fascinating gem fact..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Gem Type</label>
              <select
                value={formData.gem_type}
                onChange={(e) => setFormData(prev => ({ ...prev, gem_type: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              >
                <option value="">Select gem type</option>
                {gemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="e.g., Geological Survey, Research Institute"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="is_active" className="text-white text-sm">Active</label>
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