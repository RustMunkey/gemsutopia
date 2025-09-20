'use client';
import { useEffect, useState } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';

// Generic hook for any table
export function useRealtimeData<T>(table: string, id?: string) {
  const { getData, getAllData, updateOptimistic, subscribe, isConnected } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the data
  const data = id ? getData(table, id) : getAllData(table);

  // Track loading state
  useEffect(() => {
    if (isConnected && data !== undefined) {
      setLoading(false);
      setError(null);
    }
  }, [isConnected, data]);

  // Subscribe to changes for this specific data
  useEffect(() => {
    const unsubscribe = subscribe(table, (updatedData, type) => {
      if (id && updatedData.id === id) {
        // This specific item was updated
        console.log(`📦 ${table}/${id} updated:`, type, updatedData);
      } else if (!id) {
        // Any item in this table was updated
        console.log(`📦 ${table} updated:`, type, updatedData);
      }
    });

    return unsubscribe;
  }, [table, id, subscribe]);

  const update = async (updateData: any) => {
    if (!id) {
      throw new Error('Cannot update without specific ID');
    }
    return updateOptimistic(table, id, updateData);
  };

  return {
    data,
    loading,
    error,
    isConnected,
    update
  };
}

// Specific hooks for your tables
export function useRealtimeAuction(id: string) {
  return useRealtimeData('auctions', id);
}

export function useRealtimeAuctions() {
  return useRealtimeData('auctions');
}

export function useRealtimeProduct(id: string) {
  return useRealtimeData('products', id);
}

export function useRealtimeProducts() {
  return useRealtimeData('products');
}

export function useRealtimeCategories() {
  return useRealtimeData('categories');
}

export function useRealtimeOrders() {
  return useRealtimeData('orders');
}

export function useRealtimeBids(auctionId?: string) {
  const { data, loading, error, isConnected } = useRealtimeData('bids');

  // Filter bids by auction if specified
  const filteredData = auctionId
    ? Object.values(data || {}).filter((bid: any) => bid.auction_id === auctionId)
    : data;

  return {
    data: filteredData,
    loading,
    error,
    isConnected
  };
}

// Hook for cross-table updates (like bid affecting auction)
export function useRealtimeBidding(auctionId: string) {
  const auction = useRealtimeAuction(auctionId);
  const bids = useRealtimeBids(auctionId);
  const { updateOptimistic } = useRealtime();

  const placeBid = async (bidAmount: number) => {
    // Optimistically update auction
    const optimisticUpdate = {
      current_bid: bidAmount,
      bid_count: (auction.data?.bid_count || 0) + 1,
      updated_at: new Date().toISOString()
    };

    // Apply optimistic update immediately
    await updateOptimistic('auctions', auctionId, optimisticUpdate);

    // The API call will be handled by your existing bid endpoint
    // Real-time subscriptions will sync the actual result
    return true;
  };

  return {
    auction: auction.data,
    bids: bids.data,
    loading: auction.loading || bids.loading,
    placeBid,
    isConnected: auction.isConnected
  };
}

// Hook for inventory management
export function useRealtimeInventory(productId?: string) {
  const products = useRealtimeProducts();
  const { updateOptimistic } = useRealtime();

  const updateInventory = async (id: string, newStock: number) => {
    return updateOptimistic('products', id, { inventory: newStock });
  };

  const decreaseStock = async (id: string, amount: number = 1) => {
    const product = products.data[id];
    if (product && product.inventory >= amount) {
      return updateInventory(id, product.inventory - amount);
    }
    return false;
  };

  const increaseStock = async (id: string, amount: number = 1) => {
    const product = products.data[id];
    if (product) {
      return updateInventory(id, product.inventory + amount);
    }
    return false;
  };

  return {
    products: products.data,
    loading: products.loading,
    updateInventory,
    decreaseStock,
    increaseStock,
    getStock: (id: string) => products.data[id]?.inventory || 0
  };
}