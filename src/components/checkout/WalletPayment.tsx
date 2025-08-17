'use client';
import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { TokenIcon } from '@web3icons/react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
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

          // Check for various Bitcoin wallets in order of preference
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
              console.log(`Attempting to connect to ${walletName} wallet...`);
              
              // Different connection methods for different wallets
              if (walletName === 'Unisat') {
                await bitcoinWallet.requestAccounts();
                const accounts = await bitcoinWallet.getAccounts();
                address = accounts[0];
                
                // Switch to testnet
                const network = await bitcoinWallet.getNetwork();
                if (network !== 'testnet') {
                  await bitcoinWallet.switchNetwork('testnet');
                }
              } else if (walletName === 'Xverse') {
                const response = await bitcoinWallet.request('getAccounts', null);
                address = response.result.addresses.find((addr: any) => addr.purpose === 'payment')?.address;
                if (!address) {
                  address = response.result.addresses[0]?.address;
                }
              } else if (walletName === 'Leather') {
                const response = await bitcoinWallet.request('getAddresses');
                address = response.result.addresses.find((addr: any) => addr.type === 'p2wpkh')?.address;
                if (!address) {
                  address = response.result.addresses[0]?.address;
                }
              }
              
              console.log(`✅ Connected to ${walletName} wallet:`, address);
            } catch (error: any) {
              console.error(`${walletName} connection error:`, error);
              onError(`Failed to connect ${walletName}: ${error.message}`);
              return;
            }
          } else {
            onError('No Bitcoin wallet detected. Please install Unisat, Xverse, or Leather wallet for Bitcoin payments.');
            return;
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
      } else if (selectedCrypto === 'BTC') {
        // Process actual Bitcoin testnet transaction
        await processBitcoinPayment(cryptoAmount);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      onError(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processBitcoinPayment = async (cryptoAmount: number) => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Bitcoin wallet not found');
      }

      let bitcoinWallet = null;
      let walletName = '';

      // Get the connected Bitcoin wallet
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

      if (!bitcoinWallet) {
        throw new Error('Bitcoin wallet not found for transaction');
      }

      console.log(`Processing Bitcoin payment with ${walletName}...`);

      // Merchant Bitcoin testnet address (replace with your actual testnet address)
      const merchantAddress = 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Example testnet address
      
      // Convert to satoshis (Bitcoin's smallest unit)
      const satoshiAmount = Math.floor(cryptoAmount * 100000000); // 1 BTC = 100,000,000 satoshis
      
      console.log('Bitcoin transaction details:', {
        amount: `${cryptoAmount} BTC`,
        amountInSatoshis: satoshiAmount,
        to: merchantAddress,
        from: walletAddress,
        network: 'testnet'
      });

      let txid = '';

      // Different transaction methods for different wallets
      if (walletName === 'Unisat') {
        // Unisat wallet transaction
        const txResult = await bitcoinWallet.sendBitcoin(merchantAddress, satoshiAmount);
        txid = txResult;
      } else if (walletName === 'Xverse') {
        // Xverse wallet transaction
        const response = await bitcoinWallet.request('sendTransfer', {
          recipients: [{
            address: merchantAddress,
            amount: satoshiAmount
          }]
        });
        txid = response.result.txid;
      } else if (walletName === 'Leather') {
        // Leather wallet transaction
        const response = await bitcoinWallet.request('sendTransfer', {
          recipients: [{
            address: merchantAddress,
            amount: satoshiAmount
          }]
        });
        txid = response.result.txid;
      }

      if (!txid) {
        throw new Error('Transaction failed - no transaction ID received');
      }

      console.log('Bitcoin transaction successful:', {
        txid: txid,
        amount: cryptoAmount,
        satoshis: satoshiAmount,
        from: walletAddress,
        to: merchantAddress,
        wallet: walletName
      });

      // Save order to database
      await saveCryptoOrder(txid, selectedCrypto!, cryptoAmount);
    } catch (error: any) {
      console.error('Bitcoin payment error:', error);
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient BTC balance. Please add more test BTC to your wallet.');
      } else if (error.message?.includes('rejected')) {
        throw new Error('Transaction rejected by user.');
      }
      throw new Error(`Bitcoin payment failed: ${error.message}`);
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
      
      // Merchant address (using your actual address with proper checksum)
      const merchantAddress = '0xb5Fa059E3dF30ac31027aA18f426Ea6dd449eAe3'; // Your address
      
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
      // Debug what's in the cart
      console.log('=== CART DEBUG FOR RECEIPT ===');
      console.log('Items in cart:', items);
      console.log('Items length:', items.length);
      console.log('Items type:', typeof items);
      console.log('Items is array:', Array.isArray(items));
      
      items.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          name: item.name,
          price: item.price,
          id: item.id,
          image: item.image,
          fullItem: item
        });
      });
      
      // Calculate totals properly - ensure we're using the right amount
      const subtotal = items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        console.log(`Adding item price: ${item.name} = $${price}`);
        return sum + price;
      }, 0);
      
      console.log('Calculated subtotal from cart:', subtotal);
      console.log('Payment amount received:', amount);
      console.log('Currency:', currency);
      
      // For business records, ensure accurate breakdown
      let actualSubtotal, tax, shipping;
      
      if (subtotal > 0) {
        // Use cart calculation if items are present
        actualSubtotal = subtotal;
        tax = actualSubtotal * 0.13;
        shipping = actualSubtotal >= 100 ? 0 : 15;
      } else {
        // ERROR: Cart is empty but payment was made - this shouldn't happen in production
        console.error('🚨 CRITICAL: Cart is empty but payment processed! This indicates a data flow problem.');
        console.error('Payment amount:', amount, currency);
        console.error('This suggests items were lost between cart and payment processing.');
        
        // Emergency fallback for business records (but this needs to be fixed)
        // Try to guess reasonable breakdown, but log as data integrity issue
        const hasShipping = amount > 50; // Assume shipping if over $50
        if (hasShipping) {
          const totalMinusShipping = amount - 15;
          actualSubtotal = totalMinusShipping / 1.13;
          tax = actualSubtotal * 0.13;
          shipping = 15;
        } else {
          actualSubtotal = amount / 1.13;
          tax = actualSubtotal * 0.13;
          shipping = 0;
        }
        
        console.error('🚨 Using emergency fallback calculation - MUST FIX CART DATA FLOW');
      }
      
      console.log('Calculated breakdown:', {
        subtotal: actualSubtotal,
        tax: tax,
        shipping: shipping,
        total: actualSubtotal + tax + shipping,
        paymentAmount: amount
      });
      
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
          subtotal: actualSubtotal,
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
                            <p className="text-xs text-green-600 font-medium">✓ Real transactions</p>
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
                  <br />• <strong>Bitcoin:</strong> Unisat, Xverse, Leather - Get testnet BTC from{' '}
                  <a 
                    href="https://coinfaucet.eu/en/btc-testnet/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-700"
                  >
                    Bitcoin faucet
                  </a>
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