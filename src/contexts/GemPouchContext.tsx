'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GemPouchItem {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface GemPouchContextType {
  items: GemPouchItem[];
  addItem: (item: GemPouchItem) => void;
  removeItem: (id: number) => void;
  clearPouch: () => void;
  isInPouch: (id: number) => boolean;
  itemCount: number;
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

  const addItem = (item: GemPouchItem) => {
    setItems(prev => [...prev, item]); // Allow multiple copies of same item
  };

  const removeItem = (id: number) => {
    setItems(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index > -1) {
        return prev.filter((_, i) => i !== index); // Remove only the first occurrence
      }
      return prev;
    });
  };

  const clearPouch = () => {
    setItems([]);
  };

  const isInPouch = (id: number) => {
    return items.some(item => item.id === id);
  };

  const itemCount = items.length;

  return (
    <GemPouchContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearPouch,
      isInPouch,
      itemCount
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