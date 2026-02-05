'use client';
import { useState, useEffect } from 'react';
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconChartBar,
  IconUsers,
  IconPackage,
  IconCalendar,
  IconStar,
  IconTrendingUp,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface Stat {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: string;
  data_source: string;
  is_real_time: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const iconMap = {
  users: IconUsers,
  package: IconPackage,
  calendar: IconCalendar,
  star: IconStar,
  'bar-chart': IconChartBar,
  'trending-up': IconTrendingUp,
};

export default function StatsManager() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStat, setEditingStat] = useState<Stat | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Handle both old format (direct array) and new secure format (with data property)
        const data = result.data || result;
        const statsArray = Array.isArray(data) ? data : [];

        setStats(statsArray);
      }
    } catch {
      // Error fetching stats
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (statData: Partial<Stat>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const isEditing = editingStat !== null;

      const response = await fetch('/api/admin/stats', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...statData,
          ...(isEditing && { id: editingStat.id }),
        }),
      });

      if (response.ok) {
        await fetchStats();
        setEditingStat(null);
        setShowAddModal(false);
        toast.success(isEditing ? 'Stat updated' : 'Stat created');
      } else {
        toast.error('Failed to save stat');
      }
    } catch {
      toast.error('Failed to save stat');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/stats?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchStats();
        toast.success('Stat deleted');
      } else {
        toast.error('Failed to delete stat');
      }
    } catch {
      toast.error('Failed to delete stat');
    }
  };

  const toggleActive = async (stat: Stat) => {
    await handleSave({
      ...stat,
      is_active: !stat.is_active,
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
          <h3 className="text-xl font-semibold text-white">About Section Stats</h3>
          <p className="text-slate-400">Manage statistics displayed in the about section</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-100"
        >
          <IconPlus size={16} />
          Add Stat
        </button>
      </div>

      <div className="space-y-4">
        {stats.map((stat, index) => {
          const IconComponent = iconMap[stat.icon as keyof typeof iconMap] || IconChartBar;

          return (
            <div
              key={`stat-${stat.id}-${index}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                    <IconComponent size={24} className="text-white" />
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="font-medium text-white">{stat.title}</h4>
                    <span className="text-lg font-bold text-green-400">{stat.value}</span>
                    {stat.is_real_time && (
                      <span className="rounded bg-blue-400/10 px-2 py-1 text-xs text-blue-400">
                        Real-time
                      </span>
                    )}
                    {!stat.is_active && (
                      <span className="rounded bg-red-400/10 px-2 py-1 text-xs text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-sm text-gray-400">{stat.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Source: {stat.data_source}</span>
                    <span>Order: {stat.sort_order}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(stat)}
                    className={`rounded-lg p-2 transition-colors ${
                      stat.is_active
                        ? 'text-green-400 hover:bg-green-400/10'
                        : 'text-gray-400 hover:bg-gray-400/10'
                    }`}
                    title={stat.is_active ? 'Active' : 'Inactive'}
                  >
                    {stat.is_active ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                  </button>

                  <button
                    onClick={() => setEditingStat(stat)}
                    className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-blue-400/10"
                    title="Edit"
                  >
                    <IconPencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(stat.id)}
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-400/10"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {stats.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <IconChartBar size={48} className="mx-auto mb-4 opacity-50" />
            <p>No stats yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingStat) && (
        <StatModal
          stat={editingStat}
          onSave={handleSave}
          onCancel={() => {
            setShowAddModal(false);
            setEditingStat(null);
          }}
        />
      )}
    </div>
  );
}

interface StatModalProps {
  stat: Stat | null;
  onSave: (data: Partial<Stat>) => void;
  onCancel: () => void;
}

function StatModal({ stat, onSave, onCancel }: StatModalProps) {
  const [formData, setFormData] = useState({
    title: stat?.title || '',
    value: stat?.value || '',
    description: stat?.description || '',
    icon: stat?.icon || 'bar-chart',
    data_source: stat?.data_source || 'manual',
    is_real_time: stat?.is_real_time || false,
    sort_order: stat?.sort_order?.toString() || '0',
    is_active: stat?.is_active ?? true,
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
        <h3 className="mb-6 text-xl font-semibold text-white">{stat ? 'Edit Stat' : 'Add Stat'}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Value</label>
              <input
                type="text"
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
                placeholder="e.g., 1000+, 98%, $1M+"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-20 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              placeholder="Brief description of what this stat represents"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Icon</label>
              <select
                value={formData.icon}
                onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              >
                <option value="bar-chart">Bar Chart</option>
                <option value="users">Users</option>
                <option value="package">Package</option>
                <option value="calendar">Calendar</option>
                <option value="star">Star</option>
                <option value="trending-up">Trending Up</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Data Source</label>
              <select
                value={formData.data_source}
                onChange={e => setFormData(prev => ({ ...prev, data_source: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              >
                <option value="manual">Manual</option>
                <option value="reviews">Reviews</option>
                <option value="orders">Orders</option>
                <option value="customers">Customers</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_real_time"
                checked={formData.is_real_time}
                onChange={e => setFormData(prev => ({ ...prev, is_real_time: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="is_real_time" className="text-sm text-white">
                Real-time Data
              </label>
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
