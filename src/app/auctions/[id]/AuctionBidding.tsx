'use client';
import { useState, useEffect } from 'react';
import { Clock, Gavel, DollarSign, Users, AlertCircle } from 'lucide-react';

interface Auction {
  id: string;
  title: string;
  current_bid: number;
  starting_bid: number;
  reserve_price: number | null;
  bid_count: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'pending' | 'cancelled';
  is_active: boolean;
}

interface AuctionBiddingProps {
  auction: Auction;
  onAuctionUpdate: (auction: Auction) => void;
}

export default function AuctionBidding({ auction, onAuctionUpdate }: AuctionBiddingProps) {
  const [bidAmount, setBidAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate minimum bid (current bid + increment)
  const minBidIncrement = auction.current_bid < 100 ? 5 : 
                         auction.current_bid < 500 ? 10 : 
                         auction.current_bid < 1000 ? 25 : 50;
  const minimumBid = auction.current_bid + minBidIncrement;

  // Initialize bid amount to minimum bid
  useEffect(() => {
    setBidAmount(minimumBid);
  }, [minimumBid]);

  // Update countdown timer
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.end_time).getTime();
      const timeDiff = endTime - now;

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft('Ended');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [auction.end_time]);

  const handleSubmitBid = async () => {
    if (bidAmount < minimumBid) {
      setError(`Bid must be at least $${minimumBid.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Implement bid submission to API
      console.log('Submitting bid:', bidAmount);
      
      // For now, just simulate success
      setTimeout(() => {
        setIsSubmitting(false);
        // Update auction with new bid (simulated)
        const updatedAuction = {
          ...auction,
          current_bid: bidAmount,
          bid_count: auction.bid_count + 1
        };
        onAuctionUpdate(updatedAuction);
        setBidAmount(bidAmount + minBidIncrement); // Update for next bid
      }, 1000);

    } catch {
      setError('Failed to place bid. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    switch (auction.status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'ended': return 'text-red-400 bg-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'cancelled': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const isAuctionActive = auction.status === 'active' && timeLeft !== 'Ended';
  const hasReserve = auction.reserve_price && auction.current_bid < auction.reserve_price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
        
        {/* Auction Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Live Auction</h2>
          </div>
          
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor()}`}>
            {auction.status === 'active' ? 'Live' : 
             auction.status === 'ended' ? 'Ended' : 
             auction.status === 'pending' ? 'Starting Soon' : 'Cancelled'}
          </div>
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Current Bid */}
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Current Bid</p>
            <p className="text-2xl font-bold text-white">${auction.current_bid.toFixed(2)}</p>
          </div>

          {/* Bid Count */}
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Total Bids</p>
            <p className="text-2xl font-bold text-white">{auction.bid_count}</p>
          </div>

          {/* Time Left */}
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Time Left</p>
            <p className="text-2xl font-bold text-white">{timeLeft}</p>
          </div>

          {/* Starting Bid */}
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Gavel className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Starting Bid</p>
            <p className="text-2xl font-bold text-white">${auction.starting_bid.toFixed(2)}</p>
          </div>
        </div>

        {/* Reserve Notice */}
        {hasReserve && (
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <p className="text-orange-200">
                Reserve price has not been met. Current bid must reach ${auction.reserve_price?.toFixed(2)} to win.
              </p>
            </div>
          </div>
        )}

        {/* Bidding Section */}
        {isAuctionActive ? (
          <div className="bg-black/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Place Your Bid</h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bid Amount (minimum ${minimumBid.toFixed(2)})
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min={minimumBid}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                    placeholder={`${minimumBid.toFixed(2)}`}
                  />
                </div>
              </div>
              
              <button
                onClick={handleSubmitBid}
                disabled={isSubmitting || bidAmount < minimumBid}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-500/20 rounded-xl p-6 text-center">
            <p className="text-gray-300 text-lg">
              {auction.status === 'ended' ? 'This auction has ended' :
               auction.status === 'pending' ? 'This auction has not started yet' :
               'Bidding is not available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}