'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Gavel, ArrowRight, Clock, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Auction interface
interface Auction {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  video_url?: string | null;
  featured_image_index?: number;
  starting_bid: number;
  current_bid: number;
  reserve_price: number | null;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'pending' | 'cancelled';
  is_active: boolean;
  bid_count: number;
}

// Auction Card Component
function AuctionCard({ auction, router }: { auction: Auction; router: { push: (url: string) => void } }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.end_time).getTime();
      const timeDiff = endTime - now;

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      } else {
        setTimeLeft('Ended');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [auction.end_time]);

  const isActive = auction.status === 'active' && timeLeft !== 'Ended';
  const hasReserve = auction.reserve_price && auction.current_bid < auction.reserve_price;

  return (
    <div 
      className="rounded-2xl p-4 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out cursor-pointer auction-card select-none h-full flex flex-col group hover:translate-y-[-8px] hover:shadow-3xl"
      style={{ backgroundColor: '#f0f0f0' }}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/auctions/${auction.id}`);
        window.scrollTo(0, 0);
      }}
    >
      {/* Auction Image */}
      <div className="aspect-square bg-neutral-100 rounded-lg mb-4 overflow-hidden relative">
        {auction.images && auction.images.length > 0 ? (
          <Image 
            src={auction.images[auction.featured_image_index || 0]} 
            alt={auction.title}
            fill
            className="object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-200"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={80}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200">
            <Gavel className="h-12 w-12 text-neutral-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-sm font-medium ${
          isActive 
            ? 'bg-green-500 text-white' 
            : auction.status === 'ended' 
            ? 'bg-red-500 text-white' 
            : 'bg-yellow-500 text-black'
        }`}>
          {isActive ? 'Live' : auction.status === 'ended' ? 'Ended' : 'Pending'}
        </div>

        {/* Time Left Badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeLeft}
        </div>

        {/* Reserve Badge */}
        {hasReserve && (
          <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
            Reserve Not Met
          </div>
        )}

        {/* Gemsutopia Logo */}
        <div className="absolute bottom-2 right-2 z-10">
          <Image 
            src="/logos/gems-logo.png" 
            alt="Gemsutopia"
            width={32}
            height={32}
            className="h-8 opacity-70 object-contain"
          />
        </div>
      </div>

      {/* Auction Info */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-bold text-black mb-2 text-center leading-tight group-hover:text-neutral-700 transition-colors">
          {auction.title}
        </h3>
        
        {auction.description && (
          <p className="text-sm text-neutral-600 text-center mb-4 line-clamp-2 flex-1">
            {auction.description}
          </p>
        )}

        {/* Bidding Info */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">Current Bid:</span>
            <span className="font-bold text-green-600 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {auction.current_bid.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">Bids:</span>
            <span className="font-medium text-neutral-800">{auction.bid_count}</span>
          </div>
        </div>

        {/* Bid Button */}
        <div className="mt-auto">
          <div className="flex items-center justify-center gap-2 text-black group-hover:text-neutral-700 transition-colors">
            <span className="font-medium">{isActive ? 'Place Bid' : 'View Auction'}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Auctions() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'ending-soon'>('all');

  // Load auctions data from API
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch all active auctions from API (public access, no auth required)
        const response = await fetch('/api/auctions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch auctions');
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Fetched auctions:', data.auctions);
          setAuctions(data.auctions || []);
        } else {
          setError(data.message || 'Failed to load auctions');
        }
      } catch (error) {
        console.error('Error fetching auctions:', error);
        setError('Failed to load auctions. Please try again.');
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  const filteredAuctions = auctions.filter(auction => {
    switch (filter) {
      case 'active':
        return auction.status === 'active';
      case 'ending-soon':
        const hoursLeft = (new Date(auction.end_time).getTime() - Date.now()) / (1000 * 60 * 60);
        return auction.status === 'active' && hoursLeft <= 24;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <div className="relative z-10">
        <Header />
      </div>
      
      {loading ? (
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading auctions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-grow py-16 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
              <p className="font-semibold mb-2">Error Loading Auctions</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Gem Auctions</h1>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Bid on exceptional gemstone specimens from Alberta&apos;s pristine landscapes. Each auction features authentic gems personally mined and carefully selected by Reese
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 flex gap-1">
                {[
                  { key: 'all', label: 'All Auctions' },
                  { key: 'active', label: 'Active' },
                  { key: 'ending-soon', label: 'Ending Soon' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as 'all' | 'active' | 'ending-soon')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filter === key
                        ? 'bg-black text-white shadow-sm'
                        : 'text-neutral-600 hover:text-black hover:bg-white/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auctions Grid */}
            {filteredAuctions.length === 0 ? (
              <div className="text-center py-16">
                <Gavel className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">No Auctions Available</h3>
                <p className="text-neutral-600">
                  {filter === 'all' 
                    ? "We're preparing exciting auction listings. Check back soon!"
                    : `No ${filter === 'active' ? 'active' : 'ending soon'} auctions at the moment.`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} router={router} />
                ))}
              </div>
            )}

            {/* Summary */}
            {filteredAuctions.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-neutral-600">
                  {filteredAuctions.length} {filteredAuctions.length === 1 ? 'auction' : 'auctions'} 
                  {filter !== 'all' && ` (${filter.replace('-', ' ')})`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="relative z-10">
        <Footer />
      </div>
      
      <style jsx>{`
        @media (hover: hover) and (pointer: fine) {
          .auction-card:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
          }
        }
        .auction-card {
          will-change: transform;
        }
        .auction-card {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        .auction-card img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}