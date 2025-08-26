'use client';
import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Copy, Calendar, Percent, DollarSign, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { getAllDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode, DiscountCode } from '@/lib/database/discountCodes';

export default function DiscountCodes() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    free_shipping: false,
    minimum_order: 0,
    usage_limit: '',
    expires_at: ''
  });

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    setLoading(true);
    try {
      const codes = await getAllDiscountCodes();
      setDiscountCodes(codes);
    } catch (error) {
      console.error('Error loading discount codes:', error);
      showNotification('error', 'Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || formData.discount_value <= 0) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      const codeData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        free_shipping: formData.free_shipping,
        minimum_order: formData.minimum_order,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
        is_active: true,
        expires_at: formData.expires_at || undefined
      };

      if (editingCode) {
        const success = await updateDiscountCode(editingCode.id!, codeData);
        if (success) {
          showNotification('success', 'Discount code updated successfully!');
        } else {
          showNotification('error', 'Failed to update discount code');
          return;
        }
      } else {
        const newCode = await createDiscountCode(codeData);
        if (newCode) {
          showNotification('success', 'Discount code created successfully!');
        } else {
          showNotification('error', 'Failed to create discount code');
          return;
        }
      }

      // Reset form and refresh
      resetForm();
      loadDiscountCodes();
    } catch (error) {
      console.error('Error saving discount code:', error);
      showNotification('error', 'Error saving discount code');
    }
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      free_shipping: code.free_shipping,
      minimum_order: code.minimum_order,
      usage_limit: code.usage_limit?.toString() || '',
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      const success = await deleteDiscountCode(id);
      if (success) {
        showNotification('success', 'Discount code deleted successfully!');
        loadDiscountCodes();
      } else {
        showNotification('error', 'Failed to delete discount code');
      }
    } catch (error) {
      console.error('Error deleting discount code:', error);
      showNotification('error', 'Error deleting discount code');
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const success = await updateDiscountCode(code.id!, { is_active: !code.is_active });
      if (success) {
        showNotification('success', `Discount code ${code.is_active ? 'disabled' : 'enabled'} successfully!`);
        loadDiscountCodes();
      } else {
        showNotification('error', 'Failed to update discount code');
      }
    } catch (error) {
      console.error('Error toggling discount code:', error);
      showNotification('error', 'Error updating discount code');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showNotification('success', `Code "${code}" copied to clipboard!`);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      free_shipping: false,
      minimum_order: 0,
      usage_limit: '',
      expires_at: ''
    });
    setEditingCode(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white font-medium">Loading Discount Codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Discount Codes</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Code
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-8 bg-white/10 border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingCode ? 'Edit Discount Code' : 'Create New Discount Code'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Discount Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none uppercase"
                  placeholder="SUMMER20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  placeholder="20% off summer collection"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Discount Type</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value as 'percentage' | 'fixed_amount' }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Order ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Usage Limit (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expires (optional)</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="free-shipping"
                checked={formData.free_shipping}
                onChange={(e) => setFormData(prev => ({ ...prev, free_shipping: e.target.checked }))}
                className="w-4 h-4 text-white bg-black border-white/20 rounded focus:ring-white focus:ring-2"
              />
              <label htmlFor="free-shipping" className="text-sm font-medium text-slate-300">
                Include Free Shipping
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Tag className="h-4 w-4" />
                {editingCode ? 'Update Code' : 'Create Code'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discount Codes List */}
      <div className="space-y-4">
        {discountCodes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No discount codes yet</h3>
            <p className="text-slate-400 mb-4">Create your first discount code to start offering promotions</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create First Code
            </button>
          </div>
        ) : (
          discountCodes.map((code) => (
            <div key={code.id} className={`bg-white/10 border border-white/20 rounded-xl p-6 ${!code.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white font-mono bg-black/30 px-3 py-1 rounded-lg">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {code.is_active ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {code.description && (
                    <p className="text-slate-300 mb-3">{code.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-300">
                      {code.discount_type === 'percentage' ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      {code.discount_type === 'percentage' 
                        ? `${code.discount_value}% off` 
                        : `$${code.discount_value} off`
                      }
                    </div>
                    
                    {code.free_shipping && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Truck className="h-4 w-4" />
                        Free shipping
                      </div>
                    )}
                    
                    {code.minimum_order > 0 && (
                      <div className="text-slate-400">
                        Min. order: ${code.minimum_order}
                      </div>
                    )}
                    
                    {code.usage_limit && (
                      <div className="text-slate-400">
                        Used: {code.used_count}/{code.usage_limit}
                      </div>
                    )}
                    
                    {code.expires_at && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        Expires: {new Date(code.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(code)}
                    className={`p-2 rounded-lg transition-colors ${
                      code.is_active 
                        ? 'text-green-400 hover:bg-green-400/10' 
                        : 'text-slate-400 hover:bg-slate-400/10'
                    }`}
                    title={code.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {code.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(code)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(code.id!)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}