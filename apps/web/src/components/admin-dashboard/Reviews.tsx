'use client';
import { useState, useEffect } from 'react';
import { IconStar, IconEye, IconEyeOff, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { useMode } from '@/lib/contexts/ModeContext';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface Review {
  id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title?: string;
  content: string;
  is_featured: boolean;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export default function Reviews() {
  const { mode } = useMode();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, pending, featured
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReview, setNewReview] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    title: '',
    content: '',
    is_approved: true,
    is_featured: false,
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/reviews', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch {
      // Error fetching reviews
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(); // Refresh the list
        toast.success('Review updated');
      } else {
        toast.error('Failed to update review');
      }
    } catch {
      toast.error('Failed to update review');
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(); // Refresh the list
        toast.success('Review deleted');
      } else {
        toast.error('Failed to delete review');
      }
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const createReview = async () => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newReview.customer_name,
          email: newReview.customer_email || 'admin@gemsutopia.com',
          rating: newReview.rating,
          title: newReview.title,
          review: newReview.content,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // If review was created, approve it immediately since it's admin-added
        const token = localStorage.getItem('admin-token');
        await fetch(`/api/admin/reviews/${data.review.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: newReview.is_approved,
            is_featured: newReview.is_featured,
          }),
        });

        setShowAddModal(false);
        setNewReview({
          customer_name: '',
          customer_email: '',
          rating: 5,
          title: '',
          content: '',
          is_approved: true,
          is_featured: false,
        });
        fetchReviews();
        toast.success('Review created');
      } else {
        toast.error('Failed to create review');
      }
    } catch {
      toast.error('Failed to create review');
    }
  };

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'approved':
        return review.is_approved;
      case 'pending':
        return !review.is_approved;
      case 'featured':
        return review.is_featured;
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/20 bg-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white">Customer Reviews ✨</h1>
            <p className="text-slate-400">Manage customer feedback and testimonials</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-100"
            >
              Add Review
            </button>
            <div
              className={`rounded-xl px-6 py-3 ${mode === 'dev' ? 'border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : 'border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5'}`}
            >
              <span className="text-lg font-semibold text-white">{reviews.length}</span>
              <span className="ml-2 text-slate-400">Total Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-white/20 bg-black p-1">
        {[
          { id: 'all', label: 'All Reviews' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'approved', label: 'Approved' },
          { id: 'featured', label: 'Featured' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.id ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-white/20 bg-black py-12 text-center text-slate-400">
          <IconStar size={48} className="mx-auto mb-4 text-slate-500" />
          <p className="text-lg font-medium">No reviews found</p>
          <p>Customer reviews will appear here once submitted</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <div key={review.id} className="rounded-2xl border border-white/20 bg-black p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold text-white">{review.customer_name}</h3>
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                    <span className="text-sm text-slate-400">{formatDate(review.created_at)}</span>
                  </div>
                  {review.title && (
                    <h4 className="mb-2 text-lg font-medium text-white">{review.title}</h4>
                  )}
                  <p className="leading-relaxed text-slate-300">{review.content}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${
                        review.is_approved
                          ? 'border border-green-500/30 bg-green-500/20 text-green-400'
                          : 'border border-orange-500/30 bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {review.is_featured && (
                      <span className="rounded-lg border border-purple-500/30 bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  {/* Approve/Unapprove */}
                  <button
                    onClick={() => updateReview(review.id, { is_approved: !review.is_approved })}
                    className={`rounded-lg p-2 transition-colors ${
                      review.is_approved
                        ? 'text-orange-400 hover:bg-orange-500/10 hover:text-orange-300'
                        : 'text-green-400 hover:bg-green-500/10 hover:text-green-300'
                    }`}
                    title={review.is_approved ? 'Unapprove' : 'Approve'}
                  >
                    {review.is_approved ? <IconX size={20} /> : <IconCheck size={20} />}
                  </button>

                  {/* Toggle Featured */}
                  <button
                    onClick={() => updateReview(review.id, { is_featured: !review.is_featured })}
                    className={`rounded-lg p-2 transition-colors ${
                      review.is_featured
                        ? 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={review.is_featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <IconStar size={20} className={review.is_featured ? 'fill-purple-400' : ''} />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    onClick={() => updateReview(review.id, { is_active: !review.is_active })}
                    className={`rounded-lg p-2 transition-colors ${
                      review.is_active
                        ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                        : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    }`}
                    title={review.is_active ? 'Hide review' : 'Show review'}
                  >
                    {review.is_active ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    title="Delete review"
                  >
                    <IconTrash size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg border border-white/20 bg-black p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Add New Review</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white">Customer Name *</label>
                <input
                  type="text"
                  value={newReview.customer_name}
                  onChange={e => setNewReview(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={newReview.customer_email}
                  onChange={e =>
                    setNewReview(prev => ({ ...prev, customer_email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={e => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Review title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white">
                  Review Content *
                </label>
                <textarea
                  value={newReview.content}
                  onChange={e => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Enter review content"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newReview.is_approved}
                    onChange={e =>
                      setNewReview(prev => ({ ...prev, is_approved: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  Auto-approve
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newReview.is_featured}
                    onChange={e =>
                      setNewReview(prev => ({ ...prev, is_featured: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  Feature review
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={createReview}
                className="flex-1 rounded-lg bg-white px-4 py-2 font-medium text-black transition-colors hover:bg-gray-100"
              >
                Add Review
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-white/20 bg-transparent px-4 py-2 font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
