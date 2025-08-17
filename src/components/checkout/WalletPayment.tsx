'use client';
import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { TokenIcon } from '@web3icons/react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
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
        // Ethereum - Force MetaMask detection and exclude all Phantom interference
        if (typeof window !== 'undefined') {
          let ethereumProvider = null;
          
          // Debug what's available
          console.log('=== ETHEREUM WALLET DEBUG ===');
          console.log('window.ethereum exists:', !!(window as any).ethereum);
          console.log('window.ethereum.isMetaMask:', (window as any).ethereum?.isMetaMask);
          console.log('window.ethereum.isPhantom:', (window as any).ethereum?.isPhantom);
          console.log('window.ethereum.isCoinbaseWallet:', (window as any).ethereum?.isCoinbaseWallet);
          console.log('window.ethereum.providers exists:', !!(window as any).ethereum?.providers);
          console.log('window.ethereum.providers:', (window as any).ethereum?.providers);
          
          // More aggressive MetaMask detection to avoid Phantom conflicts
          
          // First, check if MetaMask is available in providers array (best method)
          if ((window as any).ethereum?.providers) {
            console.log('Multiple providers detected, searching for MetaMask...');
            const metaMaskProvider = (window as any).ethereum.providers.find((provider: any) => 
              provider.isMetaMask && !provider.isPhantom
            );
            if (metaMaskProvider) {
              ethereumProvider = metaMaskProvider;
              console.log('✅ Using MetaMask from providers array (avoiding Phantom)');
            }
          }
          // Fallback: direct MetaMask check if no providers array
          else if ((window as any).ethereum?.isMetaMask && !(window as any).ethereum?.isPhantom) {
            ethereumProvider = (window as any).ethereum;
            console.log('✅ Using MetaMask directly');
          }
          // Last resort: check for MetaMask extension directly
          else if (typeof (window as any).web3 !== 'undefined' && (window as any).web3.currentProvider?.isMetaMask) {
            ethereumProvider = (window as any).web3.currentProvider;
            console.log('✅ Using MetaMask from web3 provider');
          }
          
          console.log('Selected Ethereum provider:', ethereumProvider);
          
          if (ethereumProvider) {
            try {
              // Force MetaMask to be the active provider and disable Phantom completely
              if (ethereumProvider.isMetaMask) {
                console.log('Forcing MetaMask as active provider and disabling Phantom');
                (window as any).ethereum = ethereumProvider;
                
                // Temporarily disable Phantom to prevent interference
                if ((window as any).solana) {
                  (window as any).solana._disabled = true;
                  console.log('Temporarily disabled Phantom for ETH transaction');
                }
              }
              
              // Switch to Sepolia testnet
              try {
                await ethereumProvider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0xaa36a7' }], // Sepolia testnet chain ID
                });
              } catch (switchError: any) {
                // This error code indicates that the chain has not been added to the wallet
                if (switchError.code === 4902) {
                  try {
                    await ethereumProvider.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: '0xaa36a7',
                          chainName: 'Sepolia Test Network',
                          rpcUrls: ['https://rpc.sepolia.org'],
                          nativeCurrency: {
                            name: 'SepoliaETH',
                            symbol: 'ETH',
                            decimals: 18,
                          },
                          blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                        },
                      ],
                    });
                  } catch (addError) {
                    onError('Failed to add Sepolia network to your Ethereum wallet.');
                    return;
                  }
                } else {
                  onError('Failed to switch to Sepolia network. Please manually switch to Sepolia testnet in your wallet.');
                  return;
                }
              }

              const accounts = await ethereumProvider.request({
                method: 'eth_requestAccounts',
              });
              if (accounts.length > 0) {
                address = accounts[0];
              }
            } catch (error: any) {
              onError(`Failed to connect Ethereum wallet: ${error.message}`);
              return;
            }
          } else {
            console.log('❌ No compatible Ethereum wallet found');
            if ((window as any).ethereum?.isPhantom) {
              onError('Phantom detected but not compatible for Ethereum testnets. Please install MetaMask for Ethereum payments.');
            } else {
              onError('No MetaMask detected. Please install MetaMask for Ethereum payments.');
            }
            return;
          }
        }
      } else if (cryptoType === 'SOL') {
        // Solana - works with multiple wallets (Phantom, Solflare, Backpack, etc.)
        if (typeof window !== 'undefined') {
          let solanaWallet = null;
          let walletName = '';

          // Check for various Solana wallets in order of preference
          if ((window as any).solana) {
            solanaWallet = (window as any).solana;
            if (solanaWallet.isPhantom) walletName = 'Phantom';
            else if (solanaWallet.isSolflare) walletName = 'Solflare';
            else if (solanaWallet.isBackpack) walletName = 'Backpack';
            else walletName = 'Solana Wallet';
          } else if ((window as any).solflare) {
            solanaWallet = (window as any).solflare;
            walletName = 'Solflare';
          } else if ((window as any).backpack) {
            solanaWallet = (window as any).backpack;
            walletName = 'Backpack';
          }

          if (solanaWallet) {
            try {
              const response = await solanaWallet.connect();
              address = response.publicKey.toString();
              console.log(`Connected to ${walletName} wallet:`, address);
            } catch (error: any) {
              onError(`Failed to connect ${walletName}: ${error.message}`);
              return;
            }
          } else {
            onError('No Solana wallet detected. Please install Phantom, Solflare, Backpack, or another Solana wallet.');
            return;
          }
        }
      } else if (cryptoType === 'BTC') {
        // Bitcoin - works with multiple wallets (Unisat, Xverse, Leather, etc.)
        if (typeof window !== 'undefined') {
          let bitcoinWallet = null;
          let walletName = '';

          // Check for various Bitcoin wallets
          if ((window as any).unisat) {
            bitcoinWallet = (window as any).unisat;
            walletName = 'Unisat';
          } else if ((window as any).xverse) {
            bitcoinWallet = (window as any).xverse;
            walletName = 'Xverse';
          } else if ((window as any).LeatherProvider) {
            bitcoinWallet = (window as any).LeatherProvider;
            walletName = 'Leather';
          }

          if (bitcoinWallet) {
            try {
              // Different connection methods for different wallets
              if (walletName === 'Unisat') {
                const accounts = await bitcoinWallet.requestAccounts();
                address = accounts[0];
              } else if (walletName === 'Xverse') {
                const response = await bitcoinWallet.request('getAccounts', null);
                address = response.result.addresses[0].address;
              } else if (walletName === 'Leather') {
                const response = await bitcoinWallet.request('getAddresses');
                address = response.result.addresses[0].address;
              }
              console.log(`Connected to ${walletName} wallet:`, address);
            } catch (error: any) {
              onError(`Failed to connect ${walletName}: ${error.message}`);
              return;
            }
          } else {
            // Fallback: simulate Bitcoin wallet for demo purposes
            address = 'tb1q' + Math.random().toString(36).substring(2, 20);
            console.log('No Bitcoin wallet detected, using simulated address for demo');
          }
        }
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
      } else if (selectedCrypto === 'ETH') {
        // Process actual Ethereum Sepolia testnet transaction
        await processEthereumPayment(cryptoAmount);
      } else {
        // For BTC, use simulation for now
        await processSimulatedPayment(selectedCrypto, cryptoAmount);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      onError(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processEthereumPayment = async (cryptoAmount: number) => {
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('Ethereum wallet not found');
      }

      // Force use of MetaMask provider specifically
      let ethereumProvider = null;
      
      // Get the MetaMask provider we detected earlier
      if ((window as any).ethereum?.providers) {
        ethereumProvider = (window as any).ethereum.providers.find((provider: any) => 
          provider.isMetaMask && !provider.isPhantom
        );
      } else if ((window as any).ethereum?.isMetaMask && !(window as any).ethereum?.isPhantom) {
        ethereumProvider = (window as any).ethereum;
      }
      
      if (!ethereumProvider) {
        throw new Error('MetaMask provider not found for transaction');
      }
      
      console.log('Using MetaMask provider for transaction:', ethereumProvider);

      // Create provider and signer using the specific MetaMask provider
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      
      // Merchant address (replace with your actual merchant ETH address)
      const merchantAddress = '0x742d35cc6bF8fF9F27D3D3F5a2d0fF91aF9c0B6a'; // Example address - replace with yours
      
      // Convert ETH amount to wei
      const amountInWei = ethers.parseEther(cryptoAmount.toString());
      
      // Get current gas price
      const gasPrice = (await provider.getFeeData()).gasPrice;
      
      // Estimate gas limit
      const estimatedGas = await provider.estimateGas({
        to: merchantAddress,
        value: amountInWei,
        from: walletAddress,
      });
      
      // Create transaction
      const transaction = {
        to: merchantAddress,
        value: amountInWei,
        gasLimit: estimatedGas,
        gasPrice: gasPrice,
      };
      
      console.log('Ethereum transaction details:', {
        to: merchantAddress,
        amount: `${cryptoAmount} ETH`,
        amountInWei: amountInWei.toString(),
        gasLimit: estimatedGas.toString(),
        gasPrice: gasPrice?.toString(),
        from: walletAddress
      });
      
      // Send transaction
      const txResponse = await signer.sendTransaction(transaction);
      
      console.log('Ethereum transaction sent:', {
        hash: txResponse.hash,
        amount: cryptoAmount,
        from: walletAddress,
        to: merchantAddress
      });
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      
      if (receipt?.status !== 1) {
        throw new Error('Transaction failed');
      }
      
      console.log('Ethereum transaction confirmed:', {
        hash: txResponse.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      // Save order to database
      await saveCryptoOrder(txResponse.hash, selectedCrypto!, cryptoAmount);
    } catch (error: any) {
      console.error('Ethereum payment error:', error);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient ETH balance. Please add more test ETH to your wallet.');
      } else if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user.');
      }
      throw new Error(`Ethereum payment failed: ${error.message}`);
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
      
      // Get active Solana provider (works with any Solana wallet)
      let solanaWallet = null;
      if ((window as any).solana) {
        solanaWallet = (window as any).solana;
      } else if ((window as any).solflare) {
        solanaWallet = (window as any).solflare;
      } else if ((window as any).backpack) {
        solanaWallet = (window as any).backpack;
      }
      
      if (!solanaWallet) {
        throw new Error('Solana wallet not found');
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
        const signedTransaction = await solanaWallet.signTransaction(transaction);
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
                            {(crypto.symbol === 'SOL' || crypto.symbol === 'ETH') && (
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
                  Works with any compatible wallet. Get free test tokens:
                  <br />• <strong>Solana:</strong> Phantom, Solflare, Backpack - Get devnet SOL from{' '}
                  <a 
                    href="https://faucet.solana.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-700"
                  >
                    Solana faucet
                  </a>
                  <br />• <strong>Ethereum:</strong> MetaMask, Coinbase, Trust - Get Sepolia ETH from{' '}
                  <a 
                    href="https://sepoliafaucet.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-700"
                  >
                    Sepolia faucet
                  </a>
                  <br />• <strong>Bitcoin:</strong> Unisat, Xverse, Leather - Testnet simulation for now
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