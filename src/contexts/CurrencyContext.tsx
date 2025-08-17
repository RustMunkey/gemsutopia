'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'CAD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number) => number;
  formatPrice: (price: number) => string;
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('CAD');
  const [isClient, setIsClient] = useState(false);
  
  // Exchange rate: 1 CAD = 0.74 USD (approximate)
  const exchangeRate = 0.74;

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (!isClient) return;
    
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && ['USD', 'CAD'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, [isClient]);

  // Save to localStorage whenever currency changes (client only)
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem('currency', currency);
  }, [currency, isClient]);

  const convertPrice = (price: number): number => {
    if (currency === 'USD') {
      return price * exchangeRate;
    }
    return price; // CAD is base currency
  };

  const formatPrice = (price: number): string => {
    const convertedPrice = convertPrice(price);
    return `$${convertedPrice.toFixed(2)} ${currency}`;
  };

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency: handleSetCurrency,
      convertPrice,
      formatPrice,
      exchangeRate
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}