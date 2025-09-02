'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  inventory?: number;
  stock?: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  itemCount: number;
  removeSoldOutItems: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (!isClient) return;
    
    const savedItems = localStorage.getItem('wishlist');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, [isClient]);

  // Save to localStorage whenever items change (client only)
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items, isClient]);

  const addItem = (item: WishlistItem) => {
    // Prevent adding sold out items to wishlist
    if ((item.inventory !== undefined && item.inventory === 0) || 
        (item.stock !== undefined && item.stock === 0)) {
      return;
    }
    
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearWishlist = () => {
    setItems([]);
  };

  const removeSoldOutItems = () => {
    setItems(prev => prev.filter(item => 
      !((item.inventory !== undefined && item.inventory === 0) || 
        (item.stock !== undefined && item.stock === 0))
    ));
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearWishlist,
      isInWishlist,
      itemCount,
      removeSoldOutItems
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}