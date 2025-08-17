'use client';
import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';

interface WalletPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

export default function WalletPayment({ amount, onSuccess, onError }: WalletPaymentProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      } else {
        onError('Please install MetaMask or another Web3 wallet to continue.');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      onError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const processPayment = async () => {
    if (!isConnected || !walletAddress) {
      onError('Please connect your wallet first.');
      return;
    }

    setIsProcessing(true);

    try {
      // This is a simplified example - you'll need to implement actual payment processing
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        <h2 className="text-xl font-semibold text-gray-900">Crypto Payment</h2>
      </div>

      {!isConnected ? (
        <div className="text-center">
          <div className="mb-6">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-6">
              Connect your crypto wallet to pay with digital currency
            </p>
          </div>

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 mr-2" />
                Connect Wallet
              </>
            )}
          </button>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-900">Crypto Payment</h4>
                <p className="text-sm text-yellow-800">
                  You'll need a Web3 wallet like MetaMask to complete this payment. The amount will be converted to cryptocurrency at current rates.
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
                  Connected to {formatAddress(walletAddress)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Payment Summary</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">${amount.toFixed(2)} CAD</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Amount will be converted to cryptocurrency at current market rates
            </p>
          </div>

          <button
            onClick={processPayment}
            disabled={isProcessing}
            className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              `Pay $${amount.toFixed(2)} with Crypto`
            )}
          </button>

          <button
            onClick={() => {
              setIsConnected(false);
              setWalletAddress('');
            }}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}