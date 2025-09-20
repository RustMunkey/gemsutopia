'use client';
import { useState } from 'react';
import { X, DollarSign, Gavel } from 'lucide-react';

interface Auction {
  id: string;
  title: string;
  current_bid: number;
  reserve_price: number | null;
  bid_count: number;
  end_time: string;
  status: string;
  starting_bid: number;
}

interface BiddingModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
  onBidPlaced: (newBid: number) => void;
}

export default function BiddingModal({ auction, isOpen, onClose, onBidPlaced }: BiddingModalProps) {
  const [bidAmount, setBidAmount] = useState(auction.current_bid + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const minBidAmount = auction.current_bid + 1;
  const suggestedBids = [
    minBidAmount,
    minBidAmount + 5,
    minBidAmount + 10,
    minBidAmount + 25
  ];

  const isAuctionActive = () => {
    const now = new Date();
    const endTime = new Date(auction.end_time);
    return auction.status === 'active' && endTime > now;
  };

  const getTimeLeft = () => {
    const now = new Date().getTime();
    const end = new Date(auction.end_time).getTime();
    const timeDiff = end - now;

    if (timeDiff <= 0) return 'Ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleSubmitBid = async () => {
    if (!isAuctionActive()) {
      setError('This auction has ended');
      return;
    }

    if (bidAmount < minBidAmount) {
      setError(`Bid must be at least $${minBidAmount.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bid_amount: bidAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        onBidPlaced(bidAmount);
        onClose();
      } else {
        setError(data.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      setError('Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/10 rounded-full">
              <Gavel className="h-5 w-5 text-black" />
            </div>
            <h2 className="text-xl font-bold text-black">Place Your Bid</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Auction Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-black mb-2 line-clamp-1">{auction.title}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Bid:</span>
              <div className="font-bold text-green-600 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {auction.current_bid.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Bids:</span>
              <div className="font-medium text-black">{auction.bid_count}</div>
            </div>
            <div>
              <span className="text-gray-600">Time Left:</span>
              <div className="font-medium text-black">{getTimeLeft()}</div>
            </div>
            {auction.reserve_price && (
              <div>
                <span className="text-gray-600">Reserve:</span>
                <div className="font-medium text-orange-600">${auction.reserve_price.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {!isAuctionActive() ? (
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold mb-2">Auction Has Ended</div>
            <p className="text-gray-600 text-sm">This auction is no longer accepting bids.</p>
          </div>
        ) : (
          <>
            {/* Bid Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Your Bid Amount (minimum: ${minBidAmount.toFixed(2)})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  min={minBidAmount}
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-lg font-semibold"
                  placeholder={minBidAmount.toFixed(2)}
                />
              </div>
            </div>

            {/* Quick Bid Buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Quick Bid:</label>
              <div className="grid grid-cols-2 gap-2">
                {suggestedBids.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBidAmount(amount)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      bidAmount === amount
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    ${amount.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Reserve Price Warning */}
            {auction.reserve_price && bidAmount < auction.reserve_price && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">
                  <strong>Reserve not met:</strong> This bid is below the reserve price of ${auction.reserve_price.toFixed(2)}.
                  The seller may not be obligated to sell at this price.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBid}
                disabled={isSubmitting || bidAmount < minBidAmount}
                className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Placing Bid...' : `Bid $${bidAmount.toFixed(2)}`}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 mt-4 text-center">
              By placing a bid, you agree to purchase this item if you win the auction.
            </p>
          </>
        )}
      </div>
    </div>
  );
}