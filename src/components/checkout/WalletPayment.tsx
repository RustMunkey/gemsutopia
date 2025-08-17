'use client';
import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle, Bitcoin, Coins } from 'lucide-react';

type CryptoType = 'BTC' | 'SOL' | 'ETH';

interface WalletPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

interface CryptoOption {
  symbol: CryptoType;
  name: string;
  network: string;
  icon: React.ReactNode;
  testPrice: number; // Simulated price for devnet
}

export default function WalletPayment({ amount, onSuccess, onError }: WalletPaymentProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const cryptoOptions: CryptoOption[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'Testnet',
      icon: <Bitcoin className="h-6 w-6" />,
      testPrice: 45000 // Simulated BTC price
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'Sepolia Testnet',
      icon: <Coins className="h-6 w-6" />,
      testPrice: 2500 // Simulated ETH price
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      network: 'Devnet',
      icon: <Coins className="h-6 w-6" />,
      testPrice: 85 // Simulated SOL price
    }
  ];

  const connectWallet = async (cryptoType: CryptoType) => {
    setIsConnecting(true);
    
    try {
      let address = '';
      
      if (cryptoType === 'ETH') {
        // MetaMask for Ethereum
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          });
          if (accounts.length > 0) {
            address = accounts[0];
          }
        } else {
          onError('Please install MetaMask to use Ethereum payments.');
          return;
        }
      } else if (cryptoType === 'SOL') {
        // Phantom for Solana
        if (typeof window !== 'undefined' && (window as any).solana) {
          const response = await (window as any).solana.connect();
          address = response.publicKey.toString();
        } else {
          onError('Please install Phantom wallet to use Solana payments.');
          return;
        }
      } else if (cryptoType === 'BTC') {
        // Simulate Bitcoin wallet connection (for demo)
        address = 'tb1q' + Math.random().toString(36).substring(2, 20);
      }
      
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
        setSelectedCrypto(cryptoType);
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      onError(`Failed to connect ${cryptoType} wallet. Please try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getCryptoAmount = (cryptoType: CryptoType) => {
    const crypto = cryptoOptions.find(c => c.symbol === cryptoType);
    if (!crypto) return 0;
    return amount / crypto.testPrice;
  };

  const processPayment = async () => {
    if (!isConnected || !walletAddress || !selectedCrypto) {
      onError('Please connect your wallet first.');
      return;
    }

    setIsProcessing(true);

    try {
      const cryptoAmount = getCryptoAmount(selectedCrypto);
      
      // Simulate devnet/testnet transaction
      console.log(`Processing ${selectedCrypto} payment:`, {
        amount: cryptoAmount,
        to: 'merchant_address_placeholder',
        from: walletAddress,
        network: cryptoOptions.find(c => c.symbol === selectedCrypto)?.network
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockTransactionId = `${selectedCrypto.toLowerCase()}_testnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      onSuccess(mockTransactionId);
    } catch (error: any) {
      console.error('Payment processing error:', error);
      onError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Wallet className="h-6 w-6 text-blue-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Crypto Payment (Testnet)</h2>
      </div>

      {!isConnected ? (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Cryptocurrency</h3>
            <div className="space-y-3">
              {cryptoOptions.map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={() => connectWallet(crypto.symbol)}
                  disabled={isConnecting}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-600">
                        {crypto.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{crypto.name} ({crypto.symbol})</h4>
                        <p className="text-sm text-gray-600">{crypto.network}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {getCryptoAmount(crypto.symbol).toFixed(6)} {crypto.symbol}
                      </p>
                      <p className="text-sm text-gray-500">${crypto.testPrice.toLocaleString()} (test price)</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isConnecting && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Connecting wallet...</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-orange-900">Testnet Payment</h4>
                <p className="text-sm text-orange-800">
                  This is a demo using test networks. No real cryptocurrency will be charged. You'll need the appropriate wallet installed (MetaMask for ETH, Phantom for SOL).
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h4 className="text-sm font-semibold text-green-900">Wallet Connected</h4>
                <p className="text-sm text-green-800">
                  {selectedCrypto} wallet: {formatAddress(walletAddress)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total:</span>
                <span className="font-semibold">${amount.toFixed(2)} CAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Crypto Amount:</span>
                <span className="font-bold text-lg">
                  {getCryptoAmount(selectedCrypto!).toFixed(6)} {selectedCrypto}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="text-sm text-blue-600">
                  {cryptoOptions.find(c => c.symbol === selectedCrypto)?.network}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={processPayment}
            disabled={isProcessing}
            className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mb-3"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing {selectedCrypto} Payment...
              </>
            ) : (
              `Pay ${getCryptoAmount(selectedCrypto!).toFixed(6)} ${selectedCrypto}`
            )}
          </button>

          <button
            onClick={() => {
              setIsConnected(false);
              setWalletAddress('');
              setSelectedCrypto(null);
            }}
            className="w-full text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}