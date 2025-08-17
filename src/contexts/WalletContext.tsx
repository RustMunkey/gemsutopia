'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

type CryptoType = 'BTC' | 'SOL' | 'ETH';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string;
  selectedCrypto: CryptoType | null;
  connectWallet: (crypto: CryptoType, address: string) => void;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType | null>(null);

  const connectWallet = useCallback((crypto: CryptoType, address: string) => {
    setSelectedCrypto(crypto);
    setWalletAddress(address);
    setIsConnected(true);
  }, []);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setWalletAddress('');
    setSelectedCrypto(null);
  }, []);

  return (
    <WalletContext.Provider value={{
      isConnected,
      walletAddress,
      selectedCrypto,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}