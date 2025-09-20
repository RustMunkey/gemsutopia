'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for all real-time data
interface RealtimeData {
  auctions: Record<string, any>;
  products: Record<string, any>;
  categories: Record<string, any>;
  orders: Record<string, any>;
  users: Record<string, any>;
  bids: Record<string, any>;
  [key: string]: Record<string, any>;
}

interface OptimisticUpdate {
  id: string;
  table: string;
  data: any;
  timestamp: number;
  pending: boolean;
}

interface RealtimeContextType {
  // Data access
  getData: (table: string, id?: string) => any;
  getAllData: (table: string) => Record<string, any>;

  // Optimistic updates
  updateOptimistic: (table: string, id: string, data: any) => Promise<boolean>;

  // Connection status
  isConnected: boolean;

  // Forced refresh
  refresh: (table?: string) => void;

  // Subscribe to specific changes
  subscribe: (table: string, callback: (data: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RealtimeData>({
    auctions: {},
    products: {},
    categories: {},
    orders: {},
    users: {},
    bids: {}
  });

  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const subscribersRef = useRef<Record<string, ((data: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => void)[]>>({});

  // All tables to monitor
  const TABLES = [
    'auctions',
    'products',
    'categories',
    'orders',
    'users',
    'bids',
    'reviews',
    'wishlists',
    'cart_items',
    'payments',
    'shipping',
    'inventory_logs',
    'notifications'
  ];

  // Initialize real-time subscriptions
  useEffect(() => {
    const initializeRealtime = async () => {
      console.log('🚀 Initializing site-wide real-time subscriptions...');

      // Load initial data for all tables
      await Promise.all(TABLES.map(loadInitialData));

      // Set up real-time subscriptions for all tables
      TABLES.forEach(setupTableSubscription);

      setIsConnected(true);
      console.log('✅ Real-time system active for entire site');
    };

    initializeRealtime();

    // Cleanup
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      setIsConnected(false);
    };
  }, []);

  // Load initial data for a table
  const loadInitialData = async (table: string) => {
    try {
      const { data: tableData, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.warn(`Failed to load initial data for ${table}:`, error);
        return;
      }

      if (tableData) {
        const indexedData = tableData.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});

        setData(prev => ({
          ...prev,
          [table]: indexedData
        }));
      }
    } catch (error) {
      console.warn(`Error loading ${table}:`, error);
    }
  };

  // Set up real-time subscription for a table
  const setupTableSubscription = (table: string) => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`📡 Real-time update for ${table}:`, payload);
          handleRealtimeUpdate(table, payload);
        }
      )
      .subscribe((status) => {
        console.log(`Real-time subscription for ${table}:`, status);
      });

    channelsRef.current.push(channel);
  };

  // Handle real-time updates
  const handleRealtimeUpdate = (table: string, payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Update local data
    setData(prev => {
      const newData = { ...prev };

      switch (eventType) {
        case 'INSERT':
          newData[table] = {
            ...prev[table],
            [newRecord.id]: newRecord
          };
          break;

        case 'UPDATE':
          newData[table] = {
            ...prev[table],
            [newRecord.id]: newRecord
          };

          // Remove optimistic update if it exists
          setOptimisticUpdates(current =>
            current.filter(update =>
              !(update.table === table && update.id === newRecord.id)
            )
          );
          break;

        case 'DELETE':
          const { [oldRecord.id]: deleted, ...remaining } = prev[table];
          newData[table] = remaining;
          break;
      }

      return newData;
    });

    // Notify subscribers
    const subscribers = subscribersRef.current[table] || [];
    subscribers.forEach(callback => {
      callback(eventType === 'DELETE' ? oldRecord : newRecord, eventType as any);
    });
  };

  // Get data with optimistic updates applied
  const getData = useCallback((table: string, id?: string) => {
    if (id) {
      // Get specific item
      const baseData = data[table]?.[id];
      const optimisticUpdate = optimisticUpdates.find(
        update => update.table === table && update.id === id
      );

      return optimisticUpdate
        ? { ...baseData, ...optimisticUpdate.data }
        : baseData;
    } else {
      // Get all items in table
      return data[table] || {};
    }
  }, [data, optimisticUpdates]);

  // Get all data for a table
  const getAllData = useCallback((table: string) => {
    const baseData = data[table] || {};

    // Apply optimistic updates
    const result = { ...baseData };
    optimisticUpdates
      .filter(update => update.table === table)
      .forEach(update => {
        result[update.id] = {
          ...result[update.id],
          ...update.data
        };
      });

    return result;
  }, [data, optimisticUpdates]);

  // Optimistic update with server sync
  const updateOptimistic = useCallback(async (table: string, id: string, updateData: any): Promise<boolean> => {
    const updateId = `${table}-${id}-${Date.now()}`;

    // Apply optimistic update immediately
    const optimisticUpdate: OptimisticUpdate = {
      id: updateId,
      table,
      data: updateData,
      timestamp: Date.now(),
      pending: true
    };

    setOptimisticUpdates(prev => [...prev, optimisticUpdate]);

    try {
      // Send to server
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      if (error) {
        // Remove failed optimistic update
        setOptimisticUpdates(prev =>
          prev.filter(update => update.id !== updateId)
        );
        console.error(`Failed to update ${table}:`, error);
        return false;
      }

      // Success - real-time subscription will handle the update
      return true;

    } catch (error) {
      // Remove failed optimistic update
      setOptimisticUpdates(prev =>
        prev.filter(update => update.id !== updateId)
      );
      console.error(`Error updating ${table}:`, error);
      return false;
    }
  }, []);

  // Force refresh
  const refresh = useCallback(async (table?: string) => {
    if (table) {
      await loadInitialData(table);
    } else {
      await Promise.all(TABLES.map(loadInitialData));
    }
  }, []);

  // Subscribe to changes
  const subscribe = useCallback((table: string, callback: (data: any, type: 'INSERT' | 'UPDATE' | 'DELETE') => void) => {
    if (!subscribersRef.current[table]) {
      subscribersRef.current[table] = [];
    }
    subscribersRef.current[table].push(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current[table] = subscribersRef.current[table]?.filter(cb => cb !== callback) || [];
    };
  }, []);

  // Clean up old optimistic updates
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveSecondsAgo = Date.now() - 5000;
      setOptimisticUpdates(prev =>
        prev.filter(update => update.timestamp > fiveSecondsAgo)
      );
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  const value: RealtimeContextType = {
    getData,
    getAllData,
    updateOptimistic,
    isConnected,
    refresh,
    subscribe
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Specialized hooks for common use cases
export function useRealtimeAuctions() {
  const { getData, getAllData, updateOptimistic, subscribe } = useRealtime();

  return {
    getAuction: (id: string) => getData('auctions', id),
    getAllAuctions: () => getAllData('auctions'),
    updateAuction: (id: string, data: any) => updateOptimistic('auctions', id, data),
    subscribeToAuctions: (callback: any) => subscribe('auctions', callback)
  };
}

export function useRealtimeProducts() {
  const { getData, getAllData, updateOptimistic, subscribe } = useRealtime();

  return {
    getProduct: (id: string) => getData('products', id),
    getAllProducts: () => getAllData('products'),
    updateProduct: (id: string, data: any) => updateOptimistic('products', id, data),
    subscribeToProducts: (callback: any) => subscribe('products', callback)
  };
}

export function useRealtimeInventory() {
  const { getData, updateOptimistic, subscribe } = useRealtime();

  return {
    getStock: (productId: string) => getData('products', productId)?.inventory || 0,
    updateStock: (productId: string, newStock: number) =>
      updateOptimistic('products', productId, { inventory: newStock }),
    subscribeToInventory: (callback: any) => subscribe('products', callback)
  };
}