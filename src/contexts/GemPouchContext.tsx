'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GemPouchItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
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
        // Increase quantity if item already exists
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        // Add new item with quantity 1
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity }
          : item
      )
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