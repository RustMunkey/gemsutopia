'use client';
import { useState, useEffect, useRef } from 'react';
import { Star, Mail, TextCursorInput } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title?: string;
  content: string;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
}



export default function Reviews() {
  const [showModal, setShowModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);
  const [reviews, setReviews] = useState<Review[]>([]);
  // Animation logic for smooth infinite scroll
  useEffect(() => {
    if (!isClient || reviews.length <= 4 || !containerRef.current) return;
    
    let animationId: number;
    let startTime = performance.now();
    const container = containerRef.current;
    
    // Calculate dimensions
    const cardWidth = 352; // w-80 (320px) + mx-4 (32px margin) = 352px total width per card
    const oneSetWidth = reviews.length * cardWidth;
    
    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const speed = 45; // pixels per second - faster but still smooth
      const translateX = -(elapsed * speed);
      
      // Better normalization to prevent glitches
      let normalizedTranslateX = 0;
      if (oneSetWidth > 0) {
        const rawMod = translateX % oneSetWidth;
        normalizedTranslateX = rawMod <= -oneSetWidth ? rawMod + oneSetWidth : rawMod;
      }
      
      // Directly update the transform without causing React re-renders
      container.style.transform = `translate3d(${normalizedTranslateX}px, 0, 0)`;
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isClient, reviews]);

  // Fetch reviews from database
  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      if (data.success && data.reviews) {
        // Only show approved reviews
        const approvedReviews = data.reviews.filter((review: Review) => review.is_approved);
        setReviews(approvedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to empty array if fetch fails
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Fallback reviews removed - only showing real reviews
  

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    review: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewForm)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Thank you for your review! It will be published after approval.');
        setReviewForm({
          name: '',
          email: '',
          rating: 5,
          title: '',
          review: ''
        });
        // Refresh reviews to show the new one if it was auto-approved
        fetchReviews();
        // Close modal after successful submission
        setTimeout(() => {
          setShowModal(false);
          setSubmitMessage('');
        }, 2000);
      } else {
        setSubmitMessage('Failed to submit review. Please try again.');
      }
    } catch {
      setSubmitMessage('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative z-10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Reviews From Our Friends!</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            See what our customers are saying about our authentic gemstone collection
          </p>
        </div>
      </div>
        
      {/* Reviews Display */}
      <div className="py-12">
        {(() => {
          const displayReviews = reviews; // Only show real reviews from database
          const shouldCenter = displayReviews.length <= 4;
          
          if (shouldCenter) {
            // Centered layout for 4 or fewer items
            return (
              <div className="flex justify-center items-stretch gap-4 flex-wrap max-w-6xl mx-auto px-4 py-8">
                {displayReviews.map((review, index) => {
                  const displayName = review.customer_name;
                  const displayContent = review.content;
                  const isVerified = review.is_approved;
                  
                  return (
                    <div key={index} className="flex-shrink-0 w-80">
                      <div className="bg-white rounded-2xl p-4 shadow-lg drop-shadow-lg h-[140px] flex flex-col">
                        <div className="flex items-center mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {displayName[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <h3 className="font-semibold text-black text-sm">{displayName}</h3>
                            <div className="flex items-center">
                              {[...Array(review.rating)].map((_, i) => (
                                <span key={i} className="text-yellow-400 text-sm">★</span>
                              ))}
                              {isVerified && (
                                <span className="ml-2 text-xs text-green-600 font-medium">✓ Verified</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-neutral-700 leading-relaxed text-xs flex-grow overflow-hidden">
                          {displayContent}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // Scrolling layout for more than 4 items
            return (
              <div className="overflow-hidden py-8">
                <div 
                  ref={containerRef}
                  className="flex"
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  {displayReviews.concat(displayReviews).concat(displayReviews).map((review, index) => {
                    const displayName = review.customer_name;
                    const displayContent = review.content;
                    const isVerified = review.is_approved;
                    
                    return (
                      <div key={index} className="inline-block flex-shrink-0 w-80 mx-4">
                        <div className="bg-white rounded-2xl p-4 shadow-lg drop-shadow-lg h-[140px] flex flex-col">
                          <div className="flex items-center mb-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {displayName[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <h3 className="font-semibold text-black text-sm">{displayName}</h3>
                              <div className="flex items-center">
                                {[...Array(review.rating)].map((_, i) => (
                                  <span key={i} className="text-yellow-400 text-sm">★</span>
                                ))}
                                {isVerified && (
                                  <span className="ml-2 text-xs text-green-600 font-medium">✓ Verified</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-neutral-700 leading-relaxed text-xs flex-grow overflow-hidden">
                            {displayContent}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        })()}
      </div>

      {/* Leave a Review Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-black mb-6">Leave a Review!</h3>
          
          {/* 5 Stars */}
          <div className="flex justify-center mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-8 w-8 text-yellow-400 fill-yellow-400 mx-1" />
            ))}
          </div>
          
          {/* Review Button */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Review
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md" style={{ zIndex: 999999 }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full relative">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-black mb-2">Share Your Experience</h3>
              <p className="text-sm text-gray-600">
                Your feedback helps us grow and helps other customers make informed decisions.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>

            {submitMessage && (
              <div className={`p-3 rounded-lg mb-4 text-center text-sm ${
                submitMessage.includes('Thank you') 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2 text-center">
                  Rating
                </label>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`p-1 rounded transition-colors ${
                        star <= reviewForm.rating 
                          ? 'text-yellow-400 hover:text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star 
                        className={`h-6 w-6 ${star <= reviewForm.rating ? 'fill-current' : ''}`} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {reviewForm.rating === 0 ? 'Please select a rating' : 
                   reviewForm.rating === 1 ? 'Poor' :
                   reviewForm.rating === 2 ? 'Fair' :
                   reviewForm.rating === 3 ? 'Good' :
                   reviewForm.rating === 4 ? 'Very Good' : 'Excellent'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-black bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  placeholder="Give your review a title..."
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{reviewForm.title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Your Review
                </label>
                <textarea
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, review: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-black bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none text-sm"
                  placeholder="Share your experience with Gemsutopia..."
maxLength={500}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{reviewForm.review.length}/500 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1 flex items-center gap-1">
                    <TextCursorInput className="h-4 w-4" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    placeholder="Enter your name"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={reviewForm.email}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>


              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </section>
  );
}