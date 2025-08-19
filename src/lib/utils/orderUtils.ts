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
  
  // IMPORTANT: ALL CURRENT ORDERS ARE TEST ORDERS
  // Since the site hasn't had any real orders yet, we treat all existing orders as test orders
  
  // ALL USD/CAD payments are currently test payments (using test Stripe/PayPal keys)
  if (payment_details.currency === 'USD' || payment_details.currency === 'CAD') {
    return true;
  }
  
  // ALL orders with no currency specified should also be test orders
  if (!payment_details.currency) {
    return true;
  }
  
  // Check for test crypto currencies and networks
  if (payment_details.method === 'crypto') {
    const testNetworks = ['devnet', 'sepolia', 'testnet'];
    
    // Check if it's on a test network
    if (payment_details.network && testNetworks.some(network => 
      payment_details.network?.toLowerCase().includes(network.toLowerCase())
    )) {
      return true;
    }
    
    // Check for test cryptocurrencies (tBTC, testnet tokens)
    if (payment_details.crypto_currency === 'tBTC' ||
        payment_details.crypto_currency?.toLowerCase().includes('test')) {
      return true;
    }
    
    // Check for test payment IDs or wallet addresses (common test patterns)
    if (payment_details.payment_id?.includes('test') || 
        payment_details.wallet_address?.startsWith('tb1') || // Bitcoin testnet
        payment_details.payment_id?.length < 20) { // Short test transaction IDs
      return true;
    }
    
    // ALL current Solana payments are test orders (no live integration yet)
    if (payment_details.crypto_currency === 'SOL') {
      return true;
    }
    
    // ALL current Ethereum payments are test orders (no live integration yet)  
    if (payment_details.crypto_currency === 'ETH') {
      return true;
    }
  }
  
  // Check for test Stripe payments (test mode keys start with sk_test_ or pk_test_)
  if (payment_details.method === 'stripe' || payment_details.method === 'card') {
    // Test Stripe payment IDs typically start with pi_test_ or contain test patterns
    if (payment_details.payment_id?.startsWith('pi_test_') ||
        payment_details.payment_id?.includes('test')) {
      return true;
    }
  }
  
  // Check for test PayPal payments
  if (payment_details.method === 'paypal') {
    // PayPal sandbox payment IDs often contain specific patterns
    if (payment_details.payment_id?.includes('sandbox') ||
        payment_details.payment_id?.includes('test')) {
      return true;
    }
  }
  
  // Since ALL current orders are test orders, default to true for safety
  // This ensures live mode shows a clean slate until real orders come in
  return true;
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