import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to determine if an order is a test order based on payment details
function isTestOrderFromPayment(orderData: any): boolean {
  const { payment } = orderData;
  
  // Check payment method and detect test vs live
  switch (payment.paymentMethod) {
    case 'stripe':
    case 'card':
      // Test Stripe payments use test keys and have payment IDs starting with pi_test_
      return payment.paymentIntentId?.startsWith('pi_test_') || 
             payment.currency === 'USD' || // Currently all USD is test
             payment.currency === 'CAD';   // Currently all CAD is test
             
    case 'paypal':
      // Test PayPal payments use sandbox environment
      return payment.captureID?.includes('sandbox') ||
             payment.captureID?.includes('test') ||
             payment.currency === 'USD' || // Currently all USD is test
             payment.currency === 'CAD';   // Currently all CAD is test
             
    case 'crypto':
      // Determine test vs live based on network and currency
      const testNetworks = ['devnet', 'sepolia', 'testnet'];
      const isTestNetwork = testNetworks.some(network => 
        payment.network?.toLowerCase().includes(network.toLowerCase())
      );
      
      // Check for test cryptocurrencies
      const isTestCrypto = payment.cryptoCurrency === 'tBTC' ||
                          payment.cryptoCurrency?.toLowerCase().includes('test');
      
      // For now, all crypto payments are test until mainnet is enabled
      // TODO: Update this when mainnet crypto payments are enabled
      return true; // All current crypto is test (devnet/testnet)
      
    default:
      // Unknown payment method, default to test for safety
      return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Validate required fields
    if (!orderData.customerInfo || !orderData.payment || !orderData.totals) {
      console.error('Missing required order data fields');
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }
    
    // Determine if this is a test order
    const isTestOrder = isTestOrderFromPayment(orderData);
    
    console.log(`Order detection: ${isTestOrder ? 'TEST' : 'LIVE'} order for payment method: ${orderData.payment.paymentMethod}`);
    
    // Save order to database
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_email: orderData.customerInfo.email,
        customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        shipping_address: {
          address: orderData.customerInfo.address,
          apartment: orderData.customerInfo.apartment,
          city: orderData.customerInfo.city,
          state: orderData.customerInfo.state,
          zipCode: orderData.customerInfo.zipCode,
          country: orderData.customerInfo.country
        },
        items: orderData.items,
        payment_details: {
          method: orderData.payment.paymentMethod,
          payment_id: orderData.payment.paymentIntentId || orderData.payment.captureID || orderData.payment.transactionId,
          amount: orderData.totals.total,
          currency: orderData.payment.currency || 'CAD',
          ...(orderData.payment.paymentMethod === 'crypto' && {
            crypto_type: orderData.payment.cryptoType,
            crypto_amount: orderData.payment.cryptoAmount,
            crypto_currency: orderData.payment.cryptoCurrency,
            wallet_address: orderData.payment.walletAddress,
            network: orderData.payment.network
          })
        },
        subtotal: orderData.totals.subtotal,
        shipping: orderData.totals.shipping,
        tax: orderData.totals.tax,
        total: orderData.totals.total,
        status: 'confirmed',
        is_test_order: isTestOrder,
        created_at: orderData.timestamp
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save order', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No data returned from database insert');
      return NextResponse.json(
        { error: 'Order creation failed - no data returned' },
        { status: 500 }
      );
    }

    console.log('Order saved successfully to database:', data[0]);
    
    // Update product inventory after successful order
    if (orderData.items && Array.isArray(orderData.items)) {
      console.log('Updating inventory for items:', orderData.items);
      
      for (const item of orderData.items) {
        if (item.id && item.quantity) {
          try {
            // First get current inventory
            const { data: productData, error: fetchError } = await supabase
              .from('products')
              .select('inventory')
              .eq('id', item.id)
              .single();

            if (fetchError) {
              console.error(`Error fetching product ${item.id}:`, fetchError);
              continue;
            }

            const newInventory = Math.max(0, (productData?.inventory || 0) - item.quantity);
            
            // Update inventory
            const { error: updateError } = await supabase
              .from('products')
              .update({ inventory: newInventory })
              .eq('id', item.id);

            if (updateError) {
              console.error(`Error updating inventory for product ${item.id}:`, updateError);
            } else {
              console.log(`Updated inventory for product ${item.id}: ${productData?.inventory} -> ${newInventory}`);
            }
          } catch (inventoryError) {
            console.error(`Error processing inventory for item ${item.id}:`, inventoryError);
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, order: data[0] });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const mode = searchParams.get('mode') || 'dev'; // 'dev' or 'live'

    console.log(`Fetching orders for ${mode} mode`);

    // Filter orders based on mode
    let query = supabase
      .from('orders')
      .select('*');

    // Apply mode-based filtering
    if (mode === 'live') {
      query = query.eq('is_test_order', false);
    } else {
      query = query.eq('is_test_order', true);
    }

    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    console.log(`Found ${orders?.length || 0} ${mode} orders`);

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}