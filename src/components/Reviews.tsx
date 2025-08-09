'use client';
import { useState, useEffect } from 'react';
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

interface FallbackReview {
  name: string;
  rating: number;
  text: string;
  verified: boolean;
}

type DisplayReview = Review | FallbackReview;

export default function Reviews() {
  const [showModal, setShowModal] = useState(false);

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
  const [isLoading, setIsLoading] = useState(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fallbackReviews = [
    {
      name: "Sarah M.",
      rating: 5,
      text: "Absolutely stunning quality! The craftsmanship is endless and the beauty never fades.",
      verified: true
    },
    {
      name: "Michael R.",
      rating: 5,
      text: "The possibilities with these gems seem endless. Each piece tells its own story.",
      verified: true
    },
    {
      name: "Emma K.",
      rating: 5,
      text: "I could stare at these gemstones endlessly. The colors and patterns are mesmerizing.",
      verified: true
    },
    {
      name: "David L.",
      rating: 5,
      text: "The collection here is endless - so many unique pieces to choose from!",
      verified: true
    },
    {
      name: "Jessica T.",
      rating: 5,
      text: "My love for these gems is endless. Perfect quality and authentic sourcing.",
      verified: true
    },
    {
      name: "Ryan C.",
      rating: 5,
      text: "The beauty of these stones is endless. Highly recommend Gemsutopia!",
      verified: true
    },
    {
      name: "Amanda H.",
      rating: 5,
      text: "These gems have transformed my jewelry collection. The quality is exceptional!",
      verified: true
    },
    {
      name: "James P.",
      rating: 5,
      text: "Fast shipping and beautiful packaging. The gemstone exceeded my expectations.",
      verified: true
    },
    {
      name: "Lisa W.",
      rating: 4,
      text: "Gorgeous stones with amazing clarity. Will definitely be ordering more!",
      verified: true
    },
    {
      name: "Mark S.",
      rating: 5,
      text: "The authenticity certificate gives me complete confidence in my purchase.",
      verified: true
    },
    {
      name: "Rachel B.",
      rating: 5,
      text: "Customer service was incredible. They helped me find the perfect stone.",
      verified: true
    },
    {
      name: "Thomas G.",
      rating: 5,
      text: "The color saturation on my sapphire is breathtaking. Truly premium quality.",
      verified: true
    },
    {
      name: "Nicole F.",
      rating: 5,
      text: "I've been collecting gems for years, and this is the best source I've found.",
      verified: true
    },
    {
      name: "Kevin M.",
      rating: 4,
      text: "Great variety and competitive prices. The website is easy to navigate too.",
      verified: true
    },
    {
      name: "Sophia L.",
      rating: 5,
      text: "My emerald ring is stunning! The craftsmanship is absolutely perfect.",
      verified: true
    },
    {
      name: "Daniel K.",
      rating: 5,
      text: "Secure packaging ensured my delicate gemstone arrived in perfect condition.",
      verified: true
    },
    {
      name: "Victoria R.",
      rating: 5,
      text: "The investment value of these stones is excellent. Great for collectors.",
      verified: true
    },
    {
      name: "Alex C.",
      rating: 5,
      text: "Educational resources on the site helped me make an informed purchase.",
      verified: true
    },
    {
      name: "Grace T.",
      rating: 4,
      text: "Beautiful selection of rare gems. The photos match reality perfectly.",
      verified: true
    },
    {
      name: "Benjamin J.",
      rating: 5,
      text: "The healing properties information was very helpful and accurate.",
      verified: true
    },
    {
      name: "Olivia D.",
      rating: 5,
      text: "My custom setting turned out exactly as I envisioned. Amazing work!",
      verified: true
    },
    {
      name: "Christopher A.",
      rating: 5,
      text: "The gemstone grading is spot-on. Very trustworthy business practices.",
      verified: true
    },
    {
      name: "Megan Y.",
      rating: 4,
      text: "Love the monthly gem subscription box! Always exciting surprises.",
      verified: true
    },
    {
      name: "Nathan Z.",
      rating: 5,
      text: "The origin documentation for each stone shows incredible attention to detail.",
      verified: true
    },
    {
      name: "Isabella Q.",
      rating: 5,
      text: "Perfect for my metaphysical practice. The energy from these stones is pure.",
      verified: true
    },
    {
      name: "Matthew V.",
      rating: 5,
      text: "Professional gem cutting service exceeded all my expectations.",
      verified: true
    },
    {
      name: "Hannah N.",
      rating: 4,
      text: "Great educational workshops! Learned so much about gem identification.",
      verified: true
    },
    {
      name: "Ethan X.",
      rating: 5,
      text: "The rarity certificates add tremendous value to my collection.",
      verified: true
    },
    {
      name: "Chloe U.",
      rating: 5,
      text: "Ethical sourcing practices make me feel good about my purchases.",
      verified: true
    },
    {
      name: "Andrew I.",
      rating: 5,
      text: "The appraisal services are thorough and professionally done.",
      verified: true
    },
    {
      name: "Samantha O.",
      rating: 4,
      text: "Beautiful display cases available too. Great for showcasing collections.",
      verified: true
    },
    {
      name: "Joshua E.",
      rating: 5,
      text: "The gemstone cleaning service restored my old pieces to perfect condition.",
      verified: true
    },
    {
      name: "Ava W.",
      rating: 5,
      text: "Loyalty program rewards make collecting even more rewarding!",
      verified: true
    },
    {
      name: "Tyler R.",
      rating: 5,
      text: "Investment tracking tools help me monitor my collection's value growth.",
      verified: true
    },
    {
      name: "Madison T.",
      rating: 4,
      text: "The mobile app makes browsing and buying incredibly convenient.",
      verified: true
    },
    {
      name: "Jacob Y.",
      rating: 5,
      text: "Custom jewelry design service brought my vision to life perfectly.",
      verified: true
    },
    {
      name: "Emily U.",
      rating: 5,
      text: "The gemstone insurance recommendations were very helpful and practical.",
      verified: true
    },
    {
      name: "Noah I.",
      rating: 5,
      text: "Virtual consultations saved me time and helped me make better choices.",
      verified: true
    },
    {
      name: "Abigail O.",
      rating: 4,
      text: "The gem trading platform is innovative and user-friendly.",
      verified: true
    },
    {
      name: "Mason P.",
      rating: 5,
      text: "Expert gemologists available for questions - incredible knowledge base!",
      verified: true
    },
    {
      name: "Charlotte A.",
      rating: 5,
      text: "The community forums are full of helpful collectors and experts.",
      verified: true
    },
    {
      name: "Lucas S.",
      rating: 5,
      text: "Seasonal sales and promotions offer great value for premium stones.",
      verified: true
    },
    {
      name: "Amelia D.",
      rating: 4,
      text: "The wishlist feature helps me track stones I want for future purchases.",
      verified: true
    },
    {
      name: "William F.",
      rating: 5,
      text: "Quick authentication service confirmed my vintage gem's authenticity.",
      verified: true
    },
    {
      name: "Harper G.",
      rating: 5,
      text: "The care instructions included help keep my gems looking pristine.",
      verified: true
    },
    {
      name: "Elijah H.",
      rating: 5,
      text: "Bulk purchasing options are perfect for my jewelry business needs.",
      verified: true
    },
    {
      name: "Evelyn J.",
      rating: 4,
      text: "The gift wrapping service is elegant and perfect for special occasions.",
      verified: true
    },
    {
      name: "Logan K.",
      rating: 5,
      text: "The return policy is fair and customer-friendly. Great peace of mind!",
      verified: true
    }
  ];

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

  const handleRatingClick = (rating: number) => {
    setReviewForm(prev => ({ ...prev, rating }));
  };

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
    } catch (error) {
      setSubmitMessage('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative z-10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">See What Customers are Saying!</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            See what our customers are saying about our authentic gemstone collection
          </p>
        </div>
      </div>
        
      {/* Infinite Scrolling Reviews - Full Width */}
      <div className="overflow-hidden py-4">
        <div className="flex animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused]">
          {/* First set of reviews */}
          {(reviews.length > 0 ? reviews.concat(reviews) : fallbackReviews.concat(fallbackReviews)).map((review, index) => {
            const displayName = 'customer_name' in review ? review.customer_name : review.name;
            const displayContent = 'content' in review ? review.content : review.text;
            const isVerified = 'is_approved' in review ? review.is_approved : review.verified;
            
            return (
              <div key={index} className="inline-block flex-shrink-0 w-80 mx-4">
                <div className="bg-white rounded-2xl p-4 shadow-lg drop-shadow-lg">
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
                  <p className="text-neutral-700 leading-relaxed text-xs">{displayContent}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave a Review Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-black mb-6">Leave a Review!</h3>
          
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
                />
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
                  required
                />
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
      
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @media (max-width: 768px) {
          .animate-\\[scroll_20s_linear_infinite\\] {
            animation: scroll 30s linear infinite;
          }
        }
      `}</style>
    </section>
  );
}