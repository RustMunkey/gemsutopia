'use client';
import { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Trash2, Check, X } from 'lucide-react';

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
    is_featured: false
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/reviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(); // Refresh the list
      } else {
        alert('Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(); // Refresh the list
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
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
          review: newReview.content
        })
      });

      const data = await response.json();
      if (data.success) {
        // If review was created, approve it immediately since it's admin-added
        const token = localStorage.getItem('admin-token');
        await fetch(`/api/admin/reviews/${data.review.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: newReview.is_approved,
            is_featured: newReview.is_featured
          })
        });

        setShowAddModal(false);
        setNewReview({
          customer_name: '',
          customer_email: '',
          rating: 5,
          title: '',
          content: '',
          is_approved: true,
          is_featured: false
        });
        fetchReviews();
      }
    } catch (error) {
      console.error('Error creating review:', error);
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
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Customer Reviews ✨</h1>
            <p className="text-slate-400">Manage customer feedback and testimonials</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Add Review
            </button>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl px-6 py-3">
              <span className="text-white text-lg font-semibold">{reviews.length}</span>
              <span className="text-slate-400 ml-2">Total Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-black border border-white/20 rounded-2xl p-1">
        {[
          { id: 'all', label: 'All Reviews' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'approved', label: 'Approved' },
          { id: 'featured', label: 'Featured' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-white text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-black border border-white/20 rounded-2xl">
          <Star className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <p className="text-lg font-medium">No reviews found</p>
          <p>Customer reviews will appear here once submitted</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-black border border-white/20 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{review.customer_name}</h3>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-slate-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="text-lg font-medium text-white mb-2">{review.title}</h4>
                  )}
                  <p className="text-slate-300 leading-relaxed">{review.content}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      review.is_approved
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {review.is_featured && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {/* Approve/Unapprove */}
                  <button
                    onClick={() => updateReview(review.id, { is_approved: !review.is_approved })}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_approved
                        ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                        : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                    }`}
                    title={review.is_approved ? 'Unapprove' : 'Approve'}
                  >
                    {review.is_approved ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                  </button>
                  
                  {/* Toggle Featured */}
                  <button
                    onClick={() => updateReview(review.id, { is_featured: !review.is_featured })}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_featured
                        ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={review.is_featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Star className={`h-5 w-5 ${review.is_featured ? 'fill-purple-400' : ''}`} />
                  </button>
                  
                  {/* Toggle Visibility */}
                  <button
                    onClick={() => updateReview(review.id, { is_active: !review.is_active })}
                    className={`p-2 rounded-lg transition-colors ${
                      review.is_active
                        ? 'text-slate-400 hover:text-white hover:bg-white/10'
                        : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                    }`}
                    title={review.is_active ? 'Hide review' : 'Show review'}
                  >
                    {review.is_active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                  
                  {/* Delete */}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/20 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Add New Review</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newReview.customer_name}
                  onChange={(e) => setNewReview(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newReview.customer_email}
                  onChange={(e) => setNewReview(prev => ({ ...prev, customer_email: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
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
                <label className="block text-sm font-medium text-white mb-1">Title (Optional)</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Review title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">Review Content *</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                  placeholder="Enter review content"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newReview.is_approved}
                    onChange={(e) => setNewReview(prev => ({ ...prev, is_approved: e.target.checked }))}
                    className="mr-2"
                  />
                  Auto-approve
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newReview.is_featured}
                    onChange={(e) => setNewReview(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="mr-2"
                  />
                  Feature review
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={createReview}
                className="flex-1 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Add Review
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-transparent border border-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
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