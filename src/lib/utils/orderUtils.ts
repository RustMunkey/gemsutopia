// Utility functions for order processing

interface PaymentDetails {
  method: string;
  payment_id: string;
  amount: number;
  currency?: string;
  crypto_type?: string;
  crypto_amount?: number;
  crypto_currency?: string;
  wallet_address?: string;
  network?: string;
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  status: string;
  created_at: string;
  items: any[];
  payment_details: PaymentDetails;
}

// Utility function to detect test orders
export const isTestOrder = (order: Order): boolean => {
  const { payment_details } = order;
  
  if (!payment_details) {
    return true; // No payment details = test order
  }
  
  // Check for test Stripe payments
  if (payment_details.method === 'stripe') {
    // Test Stripe payment IDs start with specific prefixes
    if (payment_details.payment_id?.startsWith('pi_test_') ||
        payment_details.payment_id?.startsWith('cs_test_') ||
        payment_details.payment_id?.startsWith('ch_test_') ||
        payment_details.payment_id?.startsWith('pm_test_') ||
        payment_details.payment_id?.includes('test')) {
      return true;
    }
    
    // If using test Stripe keys (check environment variables if available)
    // For now, we can detect based on the current API keys in use
    const usingTestKeys = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || 
                          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');
    if (usingTestKeys) {
      return true;
    }
    
    // Non-test Stripe payment IDs (live) start with pi_, cs_, etc. without "test_"
    return false;
  }
  
  // Check for test PayPal payments
  if (payment_details.method === 'paypal') {
    // PayPal sandbox (test) environment
    if (payment_details.payment_id?.includes('sandbox') ||
        payment_details.payment_id?.includes('test')) {
      return true;
    }
    
    // Check if using PayPal sandbox client ID
    const usingSandbox = process.env.PAYPAL_CLIENT_ID?.includes('sandbox') ||
                         process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.includes('sandbox');
    if (usingSandbox) {
      return true;
    }
    
    // For now, assume all PayPal orders are test until live credentials are confirmed
    return true;
  }
  
  // Check for test crypto currencies and networks
  if (payment_details.method === 'crypto') {
    const testNetworks = [
      'devnet',
      'testnet', 
      'sepolia',
      'goerli',
      'rinkeby',
      'kovan',
      'ropsten',
      'mumbai',
      'polygon-mumbai',
      'bitcoin testnet',
      'ethereum sepolia'
    ];
    
    // Check if it's on a test network
    if (payment_details.network && testNetworks.some(network => 
      payment_details.network!.toLowerCase().includes(network.toLowerCase())
    )) {
      return true;
    }
    
    // Check for test cryptocurrencies or wallet addresses
    if (payment_details.crypto_currency === 'tBTC' ||
        payment_details.crypto_currency?.toLowerCase().includes('test') ||
        payment_details.wallet_address?.startsWith('tb1') || // Bitcoin testnet
        payment_details.payment_id?.includes('testnet')) {
      return true;
    }
    
    // Bitcoin mainnet vs testnet detection
    if (payment_details.crypto_currency === 'BTC') {
      // Testnet addresses start with 'tb1', 'm', 'n', or '2' 
      // Mainnet addresses start with '1', '3', or 'bc1'
      if (payment_details.wallet_address) {
        const addr = payment_details.wallet_address;
        if (addr.startsWith('tb1') || addr.startsWith('m') || 
            addr.startsWith('n') || addr.startsWith('2')) {
          return true; // Testnet
        }
      }
      
      // Check for testnet transaction patterns
      if (payment_details.network?.toLowerCase().includes('testnet')) {
        return true;
      }
    }
    
    // Ethereum mainnet vs testnet detection
    if (payment_details.crypto_currency === 'ETH') {
      if (payment_details.network?.toLowerCase().includes('sepolia') ||
          payment_details.network?.toLowerCase().includes('goerli') ||
          payment_details.network?.toLowerCase().includes('testnet')) {
        return true; // Testnet
      }
    }
    
    // Solana mainnet vs devnet detection
    if (payment_details.crypto_currency === 'SOL') {
      if (payment_details.network?.toLowerCase().includes('devnet') ||
          payment_details.network?.toLowerCase().includes('testnet')) {
        return true; // Devnet/Testnet
      }
    }
  }
  
  // If we can't determine, assume it's live (real order)
  return false;
};

// Filter out test orders from an array
export const filterLiveOrders = (orders: Order[]): Order[] => {
  return orders.filter(order => !isTestOrder(order));
};

// Get only test orders from an array
export const filterTestOrders = (orders: Order[]): Order[] => {
  return orders.filter(order => isTestOrder(order));
};

// Filter orders based on mode (live shows only live orders, dev shows only test orders)
export const filterOrdersByMode = (orders: Order[], mode: 'live' | 'dev'): Order[] => {
  return mode === 'live' ? filterLiveOrders(orders) : filterTestOrders(orders);
};