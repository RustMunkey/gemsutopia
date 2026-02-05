'use client';
import { useState, useEffect } from 'react';
import {
  IconTag,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCopy,
  IconCalendar,
  IconPercentage,
  IconCurrencyDollar,
  IconTruck,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
  getAllDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  DiscountCode,
} from '@/lib/database/discountCodes';

export default function DiscountCodes() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    free_shipping: false,
    minimum_order: 0,
    usage_limit: '',
    expires_at: '',
  });

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    setLoading(true);
    try {
      const codes = await getAllDiscountCodes();
      setDiscountCodes(codes);
    } catch {
      toast.error('Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || formData.discount_value <= 0) {
      toast.error('Please fill in all required fields');
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
        expires_at: formData.expires_at || undefined,
      };

      if (editingCode) {
        const success = await updateDiscountCode(editingCode.id!, codeData);
        if (success) {
          toast.success('Discount code updated successfully!');
        } else {
          toast.error('Failed to update discount code');
          return;
        }
      } else {
        const newCode = await createDiscountCode(codeData);
        if (newCode) {
          toast.success('Discount code created successfully!');
        } else {
          toast.error('Failed to create discount code');
          return;
        }
      }

      // Reset form and refresh
      resetForm();
      loadDiscountCodes();
    } catch {
      toast.error('Error saving discount code');
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
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : '',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      const success = await deleteDiscountCode(id);
      if (success) {
        toast.success('Discount code deleted successfully!');
        loadDiscountCodes();
      } else {
        toast.error('Failed to delete discount code');
      }
    } catch {
      toast.error('Error deleting discount code');
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const success = await updateDiscountCode(code.id!, { is_active: !code.is_active });
      if (success) {
        toast.success(`Discount code ${code.is_active ? 'disabled' : 'enabled'} successfully!`);
        loadDiscountCodes();
      } else {
        toast.error('Failed to update discount code');
      }
    } catch {
      toast.error('Error updating discount code');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied to clipboard!`);
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
      expires_at: '',
    });
    setEditingCode(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="48" />
          <p className="font-medium text-white">Loading Discount Codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconTag size={24} className="text-white" />
          <h2 className="text-xl font-semibold text-white">Discount Codes</h2>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-black transition-colors hover:bg-gray-100"
        >
          <IconPlus size={16} />
          Create Code
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-8 rounded-xl border border-white/20 bg-white/10 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            {editingCode ? 'Edit Discount Code' : 'Create New Discount Code'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Discount Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white uppercase placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  placeholder="SUMMER20"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  placeholder="20% off summer collection"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Discount Type
                </label>
                <select
                  value={formData.discount_type}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                    }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={formData.discount_value}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      discount_value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Minimum Order ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_order}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      minimum_order: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Usage Limit (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={e => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white placeholder-slate-400 focus:border-white/40 focus:outline-none"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Expires (optional)
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={e => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="free-shipping"
                checked={formData.free_shipping}
                onChange={e => setFormData(prev => ({ ...prev, free_shipping: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black text-white focus:ring-2 focus:ring-white"
              />
              <label htmlFor="free-shipping" className="text-sm font-medium text-slate-300">
                Include Free Shipping
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-black transition-colors hover:bg-gray-100"
              >
                <IconTag size={16} />
                {editingCode ? 'Update Code' : 'Create Code'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-white/20 px-4 py-2 text-white transition-colors hover:bg-white/10"
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
          <div className="py-12 text-center">
            <IconTag size={48} className="mx-auto mb-4 text-slate-400" />
            <h3 className="mb-2 text-lg font-medium text-white">No discount codes yet</h3>
            <p className="mb-4 text-slate-400">
              Create your first discount code to start offering promotions
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mx-auto flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-black transition-colors hover:bg-gray-100"
            >
              <IconPlus size={16} />
              Create First Code
            </button>
          </div>
        ) : (
          discountCodes.map(code => (
            <div
              key={code.id}
              className={`rounded-xl border border-white/20 bg-white/10 p-6 ${!code.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-black/30 px-3 py-1 font-mono text-xl font-bold text-white">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 text-slate-400 transition-colors hover:text-white"
                        title="Copy code"
                      >
                        <IconCopy size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {code.is_active ? (
                        <span className="flex items-center gap-1 text-sm text-green-400">
                          <IconCircleCheck size={16} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-red-400">
                          <IconCircleX size={16} />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {code.description && <p className="mb-3 text-slate-300">{code.description}</p>}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-300">
                      {code.discount_type === 'percentage' ? (
                        <IconPercentage size={16} />
                      ) : (
                        <IconCurrencyDollar size={16} />
                      )}
                      {code.discount_type === 'percentage'
                        ? `${code.discount_value}% off`
                        : `$${code.discount_value} off`}
                    </div>

                    {code.free_shipping && (
                      <div className="flex items-center gap-1 text-green-400">
                        <IconTruck size={16} />
                        Free shipping
                      </div>
                    )}

                    {code.minimum_order > 0 && (
                      <div className="text-slate-400">Min. order: ${code.minimum_order}</div>
                    )}

                    {code.usage_limit && (
                      <div className="text-slate-400">
                        Used: {code.used_count}/{code.usage_limit}
                      </div>
                    )}

                    {code.expires_at && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <IconCalendar size={16} />
                        Expires: {new Date(code.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(code)}
                    className={`rounded-lg p-2 transition-colors ${
                      code.is_active
                        ? 'text-green-400 hover:bg-green-400/10'
                        : 'text-slate-400 hover:bg-slate-400/10'
                    }`}
                    title={code.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {code.is_active ? <IconCircleCheck size={16} /> : <IconCircleX size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(code)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    title="Edit"
                  >
                    <IconPencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(code.id!)}
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300"
                    title="Delete"
                  >
                    <IconTrash size={16} />
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
