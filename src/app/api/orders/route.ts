import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { filterOrdersByMode } from '@/lib/utils/orderUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to determine if an order is a test order based on payment details and system mode
function isTestOrderFromPayment(orderData: any, systemMode?: string): boolean {
  const { payment } = orderData;
  
  // If system mode is explicitly set, use it (from admin dashboard toggle)
  if (systemMode === 'live') {
    return false; // Force live order when admin is in live mode
  }
  if (systemMode === 'dev' || systemMode === 'test') {
    return true; // Force test order when admin is in dev mode
  }
  
  // Fallback to auto-detection based on payment details
  switch (payment.paymentMethod) {
    case 'stripe':
    case 'card':
      // Test Stripe payments use test keys and have payment IDs starting with pi_test_
      return payment.paymentIntentId?.startsWith('pi_test_') || false;
             
    case 'paypal':
      // Test PayPal payments use sandbox environment
      return payment.captureID?.includes('sandbox') ||
             payment.captureID?.includes('test') || false;
             
    case 'crypto':
      // Detect based on network/transaction details
      if (payment.network?.includes('mainnet') || 
          payment.network?.includes('bitcoin') ||
          payment.network?.includes('ethereum-mainnet')) {
        return false; // Live crypto payment
      }
      return payment.network?.includes('testnet') || 
             payment.network?.includes('devnet') || 
             payment.network?.includes('sepolia') || true;
      
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
      console.error('customerInfo exists:', !!orderData.customerInfo);
      console.error('payment exists:', !!orderData.payment);
      console.error('totals exists:', !!orderData.totals);
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }

    // Validate customerInfo fields
    const requiredCustomerFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country'];
    const missingCustomerFields = requiredCustomerFields.filter(field => !orderData.customerInfo[field]);
    if (missingCustomerFields.length > 0) {
      console.error('Missing customer info fields:', missingCustomerFields);
      return NextResponse.json(
        { error: `Missing customer information: ${missingCustomerFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate payment fields
    if (!orderData.payment.paymentMethod) {
      console.error('Missing payment method');
      return NextResponse.json(
        { error: 'Missing payment method' },
        { status: 400 }
      );
    }

    // Validate totals fields
    const requiredTotalFields = ['subtotal', 'total'];
    const missingTotalFields = requiredTotalFields.filter(field => orderData.totals[field] === undefined || orderData.totals[field] === null);
    if (missingTotalFields.length > 0) {
      console.error('Missing total fields:', missingTotalFields);
      return NextResponse.json(
        { error: `Missing order totals: ${missingTotalFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate items array
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.error('Missing or invalid items array');
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Pre-validate inventory before processing payment
    console.log('Validating inventory for all items before order creation...');
    for (const item of orderData.items) {
      if (item.id && item.quantity) {
        const { data: productData, error: fetchError } = await supabase
          .from('products')
          .select('inventory, name')
          .eq('id', item.id)
          .single();

        if (fetchError) {
          console.error(`Error fetching product ${item.id} for validation:`, fetchError);
          return NextResponse.json(
            { error: `Unable to validate product availability` },
            { status: 400 }
          );
        }

        const currentInventory = productData?.inventory || 0;
        if (currentInventory < item.quantity) {
          console.log(`Insufficient inventory for ${productData?.name}: requested ${item.quantity}, available ${currentInventory}`);
          return NextResponse.json(
            { 
              error: `Insufficient inventory for ${productData?.name}. Only ${currentInventory} left in stock.`,
              insufficientItems: [{
                id: item.id,
                name: productData?.name,
                requested: item.quantity,
                available: currentInventory
              }]
            },
            { status: 409 } // Conflict status for inventory issues
          );
        }
      }
    }
    
    // Get system mode from request headers or query params
    const systemMode = request.headers.get('x-system-mode') || 
                      new URL(request.url).searchParams.get('mode');
    
    // Determine if this is a test order
    const isTestOrder = isTestOrderFromPayment(orderData, systemMode || undefined);
    
    console.log(`Order detection: ${isTestOrder ? 'TEST' : 'LIVE'} order for payment method: ${orderData.payment.paymentMethod} (system mode: ${systemMode || 'auto'})`);
    
    // Prepare order data for database insert
    const orderRecord = {
      customer_email: orderData.customerInfo.email,
      customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
      shipping_address: {
        firstName: orderData.customerInfo.firstName,
        lastName: orderData.customerInfo.lastName,
        address: orderData.customerInfo.address,
        apartment: orderData.customerInfo.apartment || null,
        city: orderData.customerInfo.city,
        state: orderData.customerInfo.state,
        zipCode: orderData.customerInfo.zipCode,
        country: orderData.customerInfo.country,
        phone: orderData.customerInfo.phone || null
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
      subtotal: parseFloat(orderData.totals.subtotal) || 0,
      shipping: parseFloat(orderData.totals.shipping) || 0,
      tax: parseFloat(orderData.totals.tax) || 0,
      total: parseFloat(orderData.totals.total) || 0,
      status: 'confirmed',
      created_at: orderData.timestamp || new Date().toISOString()
    };

    console.log('Prepared order record for database:', JSON.stringify(orderRecord, null, 2));
    
    // Save order to database
    const { data, error } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Provide more specific error messages based on error type
      let userMessage = 'Failed to save order';
      if (error.code === '23502') { // NOT NULL violation
        userMessage = `Missing required field: ${error.details}`;
      } else if (error.code === '23505') { // Unique constraint violation
        userMessage = 'Duplicate order detected';
      } else if (error.code === '42703') { // Undefined column
        userMessage = 'Database schema error - invalid column';
      } else if (error.message?.includes('JSON')) {
        userMessage = 'Invalid data format in order';
      }
      
      return NextResponse.json(
        { 
          error: userMessage, 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
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
    
    // Note: Discount code tracking disabled due to missing database columns
    // This can be re-enabled when discount_codes table and related columns are added
    
    // Update product inventory after successful order with atomic operation
    if (orderData.items && Array.isArray(orderData.items)) {
      console.log('Updating inventory for items:', orderData.items);
      
      for (const item of orderData.items) {
        if (item.id && item.quantity) {
          try {
            // Use atomic decrement with constraint check to prevent negative inventory
            // This will fail if inventory would go below 0, preventing overselling
            const { data: updateResult, error: updateError } = await supabase
              .rpc('decrement_inventory', {
                product_id: item.id,
                decrement_amount: item.quantity
              });

            if (updateError) {
              console.error(`Error updating inventory for product ${item.id}:`, updateError);
              // This is a critical error - the order was created but inventory wasn't decremented
              // In a production system, you might want to implement compensation logic here
            } else {
              console.log(`Successfully decremented inventory for product ${item.id} by ${item.quantity}`);
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
    const modeParam = searchParams.get('mode') || 'dev';
    const mode = (modeParam === 'live' ? 'live' : 'dev') as 'dev' | 'live'; // 'dev' or 'live'

    console.log(`Fetching orders for ${mode} mode`);

    // Get all orders for now (we'll filter in JavaScript if needed)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch orders',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log(`Found ${orders?.length || 0} total orders from database`);

    // Filter orders based on mode (test vs live)
    const filteredOrders = orders ? filterOrdersByMode(orders, mode) : [];
    console.log(`Filtered to ${filteredOrders.length} ${mode} orders`);

    return NextResponse.json({ orders: filteredOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}