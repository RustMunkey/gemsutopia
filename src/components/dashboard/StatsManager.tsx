'use client';
import { useState, useEffect } from 'react';
import { Edit2, Plus, Trash2, Eye, EyeOff, BarChart3, Users, Package, Calendar, Star, TrendingUp } from 'lucide-react';

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
  users: Users,
  package: Package,
  calendar: Calendar,
  star: Star,
  'bar-chart': BarChart3,
  'trending-up': TrendingUp,
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
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // Handle both old format (direct array) and new secure format (with data property)
        const data = result.data || result;
        const statsArray = Array.isArray(data) ? data : [];
        
        // Debug: Check for duplicate IDs
        const ids = statsArray.map(stat => stat.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
          console.warn('Duplicate stat IDs found:', duplicateIds);
        }
        
        setStats(statsArray);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...statData,
          ...(isEditing && { id: editingStat.id })
        })
      });

      if (response.ok) {
        await fetchStats();
        setEditingStat(null);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving stat:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stat?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/stats?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting stat:', error);
    }
  };

  const toggleActive = async (stat: Stat) => {
    await handleSave({
      ...stat,
      is_active: !stat.is_active
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
          <h3 className="text-xl font-semibold text-white">About Section Stats</h3>
          <p className="text-slate-400">Manage statistics displayed in the about section</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Stat
        </button>
      </div>

      <div className="space-y-4">
        {stats.map((stat, index) => {
          const IconComponent = iconMap[stat.icon as keyof typeof iconMap] || BarChart3;
          
          return (
            <div key={`stat-${stat.id}-${index}`} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{stat.title}</h4>
                    <span className="text-lg font-bold text-green-400">{stat.value}</span>
                    {stat.is_real_time && (
                      <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                        Real-time
                      </span>
                    )}
                    {!stat.is_active && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{stat.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Source: {stat.data_source}</span>
                    <span>Order: {stat.sort_order}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(stat)}
                    className={`p-2 rounded-lg transition-colors ${
                      stat.is_active 
                        ? 'text-green-400 hover:bg-green-400/10' 
                        : 'text-gray-400 hover:bg-gray-400/10'
                    }`}
                    title={stat.is_active ? 'Active' : 'Inactive'}
                  >
                    {stat.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={() => setEditingStat(stat)}
                    className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(stat.id)}
                    className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {stats.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
    is_active: stat?.is_active ?? true
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
          {stat ? 'Edit Stat' : 'Add Stat'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Value</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                placeholder="e.g., 1000+, 98%, $1M+"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white h-20"
              placeholder="Brief description of what this stat represents"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
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
              <label className="block text-white text-sm font-medium mb-2">Data Source</label>
              <select
                value={formData.data_source}
                onChange={(e) => setFormData(prev => ({ ...prev, data_source: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              >
                <option value="manual">Manual</option>
                <option value="reviews">Reviews</option>
                <option value="orders">Orders</option>
                <option value="customers">Customers</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_real_time"
                checked={formData.is_real_time}
                onChange={(e) => setFormData(prev => ({ ...prev, is_real_time: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="is_real_time" className="text-white text-sm">Real-time Data</label>
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