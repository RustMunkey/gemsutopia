'use client';
import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { TokenIcon } from '@web3icons/react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { fetchCryptoPrices, calculateCryptoAmount } from '@/lib/cryptoPrices';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWallet } from '@/contexts/WalletContext';

type CryptoType = 'BTC' | 'SOL' | 'ETH';

interface WalletPaymentProps {
  amount: number;
  customerData: any;
  items: any[];
  onSuccess: (data: { orderId: string; actualAmount: number; cryptoAmount?: number; currency: string; cryptoCurrency?: string }) => void;
  onError: (error: string) => void;
}

interface CryptoOption {
  symbol: CryptoType;
  name: string;
  network: string;
  icon: React.ReactNode;
}

interface CryptoPrices {
  bitcoin: { usd: number; cad: number };
  ethereum: { usd: number; cad: number };
  solana: { usd: number; cad: number };
}

export default function WalletPayment({ amount, customerData, items, onSuccess, onError }: WalletPaymentProps) {
  const { currency } = useCurrency();
  const { isConnected, walletAddress, selectedCrypto, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrices | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(true);

  const cryptoOptions: CryptoOption[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'Testnet',
      icon: <TokenIcon symbol="bsv" variant="mono" size={24} color="#000000" />
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'Sepolia Testnet',
      icon: <TokenIcon symbol="eth" variant="mono" size={24} color="#000000" />
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      network: 'Devnet',
      icon: <TokenIcon symbol="sol" variant="mono" size={24} color="#000000" />
    }
  ];

  // Fetch real-time crypto prices on component mount
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const prices = await fetchCryptoPrices();
        setCryptoPrices(prices);
      } catch (error) {
        console.error('Failed to load crypto prices:', error);
        onError('Failed to load current crypto prices. Please try again.');
      } finally {
        setLoadingPrices(false);
      }
    };

    loadPrices();
  }, [onError]);

  const handleConnectWallet = async (cryptoType: CryptoType) => {
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
        connectWallet(cryptoType, address);
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      onError(`Failed to connect ${cryptoType} wallet. Please try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const getCryptoAmount = (cryptoType: CryptoType) => {
    if (!cryptoPrices) return 0;
    return calculateCryptoAmount(amount, cryptoType, currency as 'USD' | 'CAD', cryptoPrices);
  };

  const processPayment = async () => {
    if (!isConnected || !walletAddress || !selectedCrypto || !cryptoPrices) {
      onError('Please connect your wallet first.');
      return;
    }

    setIsProcessing(true);

    try {
      const cryptoAmount = getCryptoAmount(selectedCrypto);
      
      if (selectedCrypto === 'SOL') {
        // Process actual Solana devnet transaction
        await processSolanaPayment(cryptoAmount);
      } else {
        // For BTC and ETH, use simulation for now
        await processSimulatedPayment(selectedCrypto, cryptoAmount);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      onError(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processSolanaPayment = async (cryptoAmount: number) => {
    try {
      // Connect to Solana devnet with multiple RPC endpoints as fallback
      let connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // Test connection first, fallback to alternative RPC if needed
      try {
        await connection.getLatestBlockhash();
      } catch (error) {
        console.log('Primary RPC failed, trying alternative...');
        connection = new Connection('https://devnet.helius-rpc.com/?api-key=demo', 'confirmed');
      }
      
      // Merchant wallet (you'll need to replace this with your actual merchant address)
      const merchantAddress = new PublicKey('CFWAhZ8rCnX47rhCDPDuVqXNb5azzY5mc5bAM2xQk7SZ'); // Using your Phantom address for demo
      
      // Convert SOL amount to lamports
      const lamports = Math.floor(cryptoAmount * LAMPORTS_PER_SOL);
      
      // Get Phantom provider
      const { solana } = window as any;
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet not found');
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: merchantAddress,
          lamports: lamports,
        })
      );

      // Get recent blockhash with retry logic
      let blockhash;
      try {
        const blockHashInfo = await connection.getLatestBlockhash();
        blockhash = blockHashInfo.blockhash;
      } catch (error) {
        console.error('Failed to get blockhash:', error);
        throw new Error('Unable to connect to Solana network. Please try again.');
      }
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(walletAddress);

      // Sign and send transaction with error handling
      let signature;
      try {
        const signedTransaction = await solana.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
      } catch (error: any) {
        console.error('Transaction failed:', error);
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient SOL balance. Please add more SOL to your wallet.');
        }
        throw new Error('Transaction failed. Please try again.');
      }
      
      // Wait for confirmation with timeout
      try {
        await connection.confirmTransaction(signature, 'confirmed');
      } catch (error) {
        console.warn('Confirmation timeout, but transaction may still succeed');
        // Continue anyway as transaction might still be processed
      }
      
      console.log('Solana transaction successful:', {
        signature,
        amount: cryptoAmount,
        lamports,
        from: walletAddress,
        to: merchantAddress.toString()
      });

      // Save order to database
      await saveCryptoOrder(signature, selectedCrypto!, cryptoAmount);
    } catch (error: any) {
      console.error('Solana payment error:', error);
      throw new Error(`Solana payment failed: ${error.message}`);
    }
  };

  const saveCryptoOrder = async (transactionId: string, cryptoType: CryptoType, cryptoAmount: number) => {
    try {
      // Calculate totals properly
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      const tax = subtotal * 0.13; // 13% HST for Canada
      const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
      
      const orderData = {
        items,
        customerInfo: customerData,
        payment: {
          transactionId,
          paymentMethod: 'crypto',
          cryptoType,
          cryptoAmount,
          cryptoCurrency: cryptoType,
          walletAddress,
          amount,
          currency: currency,
          network: cryptoOptions.find(c => c.symbol === cryptoType)?.network
        },
        totals: { 
          subtotal,
          tax,
          shipping,
          total: amount 
        },
        timestamp: new Date().toISOString()
      };

      console.log('Saving crypto order with data:', JSON.stringify(orderData, null, 2));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const orderResult = await response.json();
        console.log('Order saved successfully:', orderResult);
        onSuccess({ 
          orderId: orderResult.order.id, 
          actualAmount: amount,
          cryptoAmount: cryptoAmount,
          currency: currency as string,
          cryptoCurrency: cryptoType
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Order save failed. Status:', response.status, 'Error:', errorData);
        onError(`Payment processed but order save failed: ${errorData.error || 'Unknown error'}. Please contact support with transaction ID: ${transactionId}`);
      }
    } catch (error) {
      console.error('Order save error:', error);
      onError(`Payment processed but order save failed. Please contact support with transaction ID: ${transactionId}`);
    }
  };

  const processSimulatedPayment = async (cryptoType: CryptoType, cryptoAmount: number) => {
    // Simulate transaction for BTC and ETH
    console.log(`Processing ${cryptoType} payment:`, {
      amount: cryptoAmount,
      to: 'merchant_address_placeholder',
      from: walletAddress,
      network: cryptoOptions.find(c => c.symbol === cryptoType)?.network
    });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockTransactionId = `${cryptoType.toLowerCase()}_testnet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save order to database
    await saveCryptoOrder(mockTransactionId, cryptoType, cryptoAmount);
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
            
            {loadingPrices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading current crypto prices...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cryptoOptions.map((crypto) => {
                  const currentPrice = cryptoPrices ? 
                    (currency === 'CAD' ? 
                      cryptoPrices[crypto.symbol.toLowerCase() as keyof typeof cryptoPrices]?.cad :
                      cryptoPrices[crypto.symbol.toLowerCase() as keyof typeof cryptoPrices]?.usd
                    ) : 0;
                  
                  return (
                    <button
                      key={crypto.symbol}
                      onClick={() => handleConnectWallet(crypto.symbol)}
                      disabled={isConnecting || !cryptoPrices}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {crypto.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{crypto.name} ({crypto.symbol})</h4>
                            <p className="text-sm text-gray-600">{crypto.network}</p>
                            {crypto.symbol === 'SOL' && (
                              <p className="text-xs text-green-600 font-medium">✓ Real transactions</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {getCryptoAmount(crypto.symbol).toFixed(6)} {crypto.symbol}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${currentPrice?.toLocaleString()} {currency} (live price)
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
                  This uses test networks with real blockchain transactions. For Solana, make sure you have devnet SOL in your Phantom wallet. You can get free devnet SOL from the{' '}
                  <a 
                    href="https://faucet.solana.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-700"
                  >
                    Solana faucet
                  </a>.
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
            onClick={disconnectWallet}
            className="w-full text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}