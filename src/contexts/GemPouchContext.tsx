'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

interface GemPouchItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number;
}

interface GemPouchContextType {
  items: GemPouchItem[];
  addItem: (item: Omit<GemPouchItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearPouch: () => void;
  isInPouch: (id: string) => boolean;
  itemCount: number;
  totalItems: number;
}

const GemPouchContext = createContext<GemPouchContextType | undefined>(undefined);

export function GemPouchProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GemPouchItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const analytics = useAnalytics();

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (!isClient) return;
    
    const savedItems = localStorage.getItem('gemPouch');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, [isClient]);

  // Save to localStorage whenever items change (client only)
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem('gemPouch', JSON.stringify(items));
  }, [items, isClient]);

  const addItem = (item: Omit<GemPouchItem, 'quantity'>) => {
    setItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        // Increase quantity if item already exists, but respect stock limit
        const newQuantity = existingItem.quantity + 1;
        const maxQuantity = item.stock ? Math.min(newQuantity, item.stock) : newQuantity;
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: maxQuantity }
            : i
        );
      } else {
        // Add new item with quantity 1
        return [...prev, { ...item, quantity: 1 }];
      }
    });
    
    // Track cart add event
    if (analytics) {
      analytics.trackCartAdd(item.id, item.name, item.price, 1);
    }
  };

  const removeItem = (id: string) => {
    const itemToRemove = items.find(item => item.id === id);
    setItems(prev => prev.filter(item => item.id !== id));
    
    // Track cart remove event
    if (analytics && itemToRemove) {
      analytics.trackCartRemove(itemToRemove.id, itemToRemove.name);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          // Respect stock limit if available
          const maxQuantity = item.stock ? Math.min(quantity, item.stock) : quantity;
          return { ...item, quantity: maxQuantity };
        }
        return item;
      })
    );
  };

  const clearPouch = () => {
    setItems([]);
  };

  const isInPouch = (id: string) => {
    return items.some(item => item.id === id);
  };

  const itemCount = items.length; // Number of unique items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0); // Total quantity

  return (
    <GemPouchContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearPouch,
      isInPouch,
      itemCount,
      totalItems
    }}>
      {children}
    </GemPouchContext.Provider>
  );
}

export function useGemPouch() {
  const context = useContext(GemPouchContext);
  if (context === undefined) {
    throw new Error('useGemPouch must be used within a GemPouchProvider');
  }
  return context;
}