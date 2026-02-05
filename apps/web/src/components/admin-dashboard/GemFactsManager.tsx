'use client';
import { useState, useEffect } from 'react';
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconDiamond,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

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
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGemFacts(data);
      }
    } catch {
      // Error fetching gem facts
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...factData,
          ...(isEditing && { id: editingFact.id }),
        }),
      });

      if (response.ok) {
        await fetchGemFacts();
        setEditingFact(null);
        setShowAddModal(false);
        toast.success(isEditing ? 'Gem fact updated' : 'Gem fact created');
      } else {
        toast.error('Failed to save gem fact');
      }
    } catch {
      toast.error('Failed to save gem fact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gem fact?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/gem-facts?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchGemFacts();
        toast.success('Gem fact deleted');
      } else {
        toast.error('Failed to delete gem fact');
      }
    } catch {
      toast.error('Failed to delete gem fact');
    }
  };

  const toggleActive = async (fact: GemFact) => {
    await handleSave({
      ...fact,
      is_active: !fact.is_active,
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
          <h3 className="text-xl font-semibold text-white">Gem Facts</h3>
          <p className="text-slate-400">Manage fascinating gem facts displayed on your website</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-100"
        >
          <IconPlus size={16} />
          Add Fact
        </button>
      </div>

      <div className="space-y-4">
        {gemFacts.map(fact => (
          <div key={fact.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                  <IconDiamond size={24} className="text-purple-400" />
                </div>
              </div>

              <div className="flex-grow">
                <div className="mb-2 flex items-center gap-2">
                  {fact.gem_type && (
                    <span className="rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                      {fact.gem_type}
                    </span>
                  )}
                  {!fact.is_active && (
                    <span className="rounded bg-red-400/10 px-2 py-1 text-xs text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mb-2 text-sm leading-relaxed text-white">{fact.fact}</p>
                {fact.source && <p className="text-xs text-gray-400">Source: {fact.source}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(fact)}
                  className={`rounded-lg p-2 transition-colors ${
                    fact.is_active
                      ? 'text-green-400 hover:bg-green-400/10'
                      : 'text-gray-400 hover:bg-gray-400/10'
                  }`}
                  title={fact.is_active ? 'Active' : 'Inactive'}
                >
                  {fact.is_active ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                </button>

                <button
                  onClick={() => setEditingFact(fact)}
                  className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-400/10"
                  title="Edit"
                >
                  <IconPencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(fact.id)}
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-400/10"
                  title="Delete"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {gemFacts.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <IconDiamond size={48} className="mx-auto mb-4 opacity-50" />
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
    is_active: fact?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const gemTypes = [
    'Diamond',
    'Emerald',
    'Ruby',
    'Sapphire',
    'Pearl',
    'Opal',
    'Amethyst',
    'Tanzanite',
    'Jade',
    'Garnet',
    'Turquoise',
    'Moonstone',
    'Peridot',
    'Aquamarine',
    'Topaz',
    'Citrine',
    'Labradorite',
    'General',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-black p-6">
        <h3 className="mb-6 text-xl font-semibold text-white">
          {fact ? 'Edit Gem Fact' : 'Add Gem Fact'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Gem Fact *</label>
            <textarea
              value={formData.fact}
              onChange={e => setFormData(prev => ({ ...prev, fact: e.target.value }))}
              className="h-24 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              placeholder="Enter a fascinating gem fact..."
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Gem Type</label>
              <select
                value={formData.gem_type}
                onChange={e => setFormData(prev => ({ ...prev, gem_type: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              >
                <option value="">Select gem type</option>
                {gemTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                placeholder="e.g., Geological Survey, Research Institute"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
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
