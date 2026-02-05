'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Review {
  id: string;
  reviewerName: string;
  reviewerEmail: string | null;
  rating: number;
  title: string | null;
  content: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'featured';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.data || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function updateReview(id: string, updates: Partial<Review>) {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Review updated!');
      await fetchReviews();
    } catch { toast.error('Failed to update review'); }
  }

  async function deleteReview(id: string) {
    if (!confirm('Permanently delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Review deleted!');
      await fetchReviews();
    } catch { toast.error('Failed to delete review'); }
  }

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved' && !r.isFeatured;
    if (filter === 'featured') return r.isFeatured;
    return true;
  });

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved' && !r.isFeatured).length,
    featured: reviews.filter(r => r.isFeatured).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-foreground rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">{reviews.length} total reviews</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'featured'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Pending Alert */}
      {counts.pending > 0 && filter !== 'pending' && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            {counts.pending} review{counts.pending > 1 ? 's' : ''} awaiting approval
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {filtered.map(review => (
          <div key={review.id} className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.reviewerName}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={i < review.rating ? '#facc15' : 'none'} stroke="#facc15" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  {/* Status Badge */}
                  {review.status === 'pending' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">Pending</span>
                  )}
                  {review.status === 'approved' && !review.isFeatured && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">Approved</span>
                  )}
                  {review.isFeatured && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">Featured</span>
                  )}
                  {review.status === 'rejected' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">Rejected</span>
                  )}
                </div>
                {review.title && (
                  <p className="text-sm font-medium text-foreground mb-0.5">{review.title}</p>
                )}
                <p className="text-sm text-muted-foreground">{review.content}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  {review.reviewerEmail && ` · ${review.reviewerEmail}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateReview(review.id, { status: 'approved' })}
                      className="text-xs font-medium px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateReview(review.id, { status: 'rejected' })}
                      className="text-xs font-medium px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {review.status === 'approved' && !review.isFeatured && (
                  <button
                    onClick={() => updateReview(review.id, { isFeatured: true })}
                    className="text-xs font-medium px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md transition-colors"
                  >
                    Feature
                  </button>
                )}
                {review.isFeatured && (
                  <button
                    onClick={() => updateReview(review.id, { isFeatured: false })}
                    className="text-xs font-medium px-3 py-1.5 bg-muted text-muted-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    Unfeature
                  </button>
                )}
                {review.status === 'approved' && (
                  <button
                    onClick={() => updateReview(review.id, { status: 'pending' })}
                    className="text-xs font-medium px-3 py-1.5 bg-muted text-muted-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    Unapprove
                  </button>
                )}
                <button
                  onClick={() => deleteReview(review.id)}
                  className="text-xs font-medium px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No {filter === 'all' ? '' : filter} reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
