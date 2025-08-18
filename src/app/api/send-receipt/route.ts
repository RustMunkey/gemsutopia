import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend only when API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  transactionId?: string;
  network?: string;
  walletAddress?: string;
  currency: string;
  // Shipping address details
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
}

function generateReceiptHTML(order: OrderData): string {
  const explorerLink = order.transactionId && order.cryptoCurrency ? 
    getExplorerLink(order.cryptoCurrency, order.transactionId) : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Receipt - Gemsutopia</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #000; margin-bottom: 5px; }
        .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-number { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 10px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background: #f8f9fa; font-weight: bold; }
        .totals { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total-final { font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid #000; }
        .crypto-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .success { color: #28a745; font-weight: bold; }
        .blockchain-link { color: #007bff; text-decoration: none; }
        .blockchain-link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">💎 GEMSUTOPIA</div>
        <p style="margin: 0; color: #666;">Premium Ethically Sourced Gemstones</p>
      </div>

      <div class="order-details">
        <div class="order-number">Order Receipt #${order.orderId.slice(-8).toUpperCase()}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
          <div>
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Customer Information</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customerEmail}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p class="success" style="margin: 10px 0;">✅ Payment Confirmed</p>
          </div>
          ${order.shippingAddress ? `
            <div>
              <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Shipping Address</h4>
              <p style="margin: 5px 0;"><strong>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</strong></p>
              <p style="margin: 5px 0;">${order.shippingAddress.address}</p>
              ${order.shippingAddress.apartment ? `<p style="margin: 5px 0;">${order.shippingAddress.apartment}</p>` : ''}
              <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
              ${order.shippingAddress.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📦 Items Purchased</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd; background: #f8f9fa;">Item</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid #ddd; background: #f8f9fa;">Qty</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #ddd; background: #f8f9fa;">Unit Price</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #ddd; background: #f8f9fa;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #ddd;">
                  <strong>${item.name}</strong><br>
                  <small style="color: #666;">Premium ethically sourced gemstone</small>
                </td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #ddd;">
                  <strong style="color: #000;">${item.quantity}</strong>
                </td>
                ${order.paymentMethod === 'crypto' && order.cryptoCurrency ? `
                  <td style="text-align: right; padding: 12px; border-bottom: 1px solid #ddd;">${item.price.toFixed(8)} ${order.cryptoCurrency}</td>
                  <td style="text-align: right; padding: 12px; border-bottom: 1px solid #ddd;">
                    <strong style="color: #000;">${(item.price * item.quantity).toFixed(8)} ${order.cryptoCurrency}</strong>
                  </td>
                ` : `
                  <td style="text-align: right; padding: 12px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)} ${order.currency}</td>
                  <td style="text-align: right; padding: 12px; border-bottom: 1px solid #ddd;">
                    <strong style="color: #000;">$${(item.price * item.quantity).toFixed(2)} ${order.currency}</strong>
                  </td>
                `}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">💰 Order Summary</h3>
        ${order.paymentMethod === 'crypto' && order.cryptoCurrency ? `
          <div class="total-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
            <span style="color: #666;">Subtotal:</span>
            <span style="font-weight: 500;">${order.subtotal.toFixed(8)} ${order.cryptoCurrency}</span>
          </div>
          <div class="total-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
            <span style="color: #666;">Shipping:</span>
            <span style="font-weight: 500; color: #28a745;">${order.shipping === 0 || order.shipping.toFixed(8) === '0.00000000' ? 'FREE' : `${order.shipping.toFixed(8)} ${order.cryptoCurrency}`}</span>
          </div>
          <div class="total-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
            <span style="color: #666;">Tax:</span>
            <span style="font-weight: 500; color: #28a745;">${order.tax === 0 || order.tax.toFixed(8) === '0.00000000' ? 'TAX FREE (Crypto)' : `${order.tax.toFixed(8)} ${order.cryptoCurrency}`}</span>
          </div>
          <div class="total-row total-final" style="display: flex; justify-content: space-between; margin: 15px 0 0 0; padding: 15px 0 0 0; border-top: 2px solid #000; font-weight: bold; font-size: 18px;">
            <span>TOTAL PAID:</span>
            <span style="color: #000;">${order.total.toFixed(8)} ${order.cryptoCurrency}</span>
          </div>
        ` : `
          <div class="total-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
            <span style="color: #666;">Subtotal:</span>
            <span style="font-weight: 500;">$${order.subtotal.toFixed(2)} ${order.currency}</span>
          </div>
          <div class="total-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
            <span style="color: #666;">Shipping:</span>
            <span style="font-weight: 500; color: #28a745;">${order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)} ${order.currency}`}</span>
          </div>
          <div class="total-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0;">
            <span style="color: #666;">Tax (${order.currency === 'CAD' ? 'HST' : 'Sales Tax'}):</span>
            <span style="font-weight: 500;">$${order.tax.toFixed(2)} ${order.currency}</span>
          </div>
          <div class="total-row total-final" style="display: flex; justify-content: space-between; margin: 15px 0 0 0; padding: 15px 0 0 0; border-top: 2px solid #000; font-weight: bold; font-size: 18px;">
            <span>TOTAL PAID:</span>
            <span style="color: #000;">$${order.total.toFixed(2)} ${order.currency}</span>
          </div>
        `}
      </div>

      ${order.paymentMethod === 'crypto' && order.cryptoCurrency && order.cryptoAmount ? `
        <div class="crypto-info">
          <h3 style="margin-top: 0; color: #1976d2;">🔗 Blockchain Payment Details</h3>
          <p><strong>Cryptocurrency:</strong> ${order.cryptoCurrency}</p>
          <p><strong>Amount Paid:</strong> ${order.cryptoAmount.toFixed(8)} ${order.cryptoCurrency}</p>
          <p><strong>Network:</strong> ${order.network || 'Testnet'}</p>
          ${order.walletAddress ? `<p><strong>Your Wallet:</strong> ${order.walletAddress.slice(0, 8)}...${order.walletAddress.slice(-6)}</p>` : ''}
          ${order.transactionId ? `
            <p><strong>Transaction ID:</strong><br>
            <code style="word-break: break-all; background: #f0f0f0; padding: 5px; border-radius: 3px;">${order.transactionId}</code></p>
          ` : ''}
          ${explorerLink ? `
            <p><strong>View on Blockchain:</strong><br>
            <a href="${explorerLink}" class="blockchain-link" target="_blank">🔍 View Transaction Details</a></p>
          ` : ''}
        </div>
      ` : ''}

      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2e7d32;">📦 What's Next?</h3>
        <p style="margin-bottom: 0;">Your order will be carefully processed and shipped within 1-2 business days. You'll receive tracking information once your gems are on their way!</p>
      </div>

      <div class="footer">
        <p><strong>Thank you for choosing Gemsutopia!</strong></p>
        <p>Questions? Contact us at <a href="mailto:gemsutopia@gmail.com">gemsutopia@gmail.com</a></p>
        <p style="font-size: 12px; color: #999;">This is an automated receipt. Please keep this for your records.</p>
      </div>
    </body>
    </html>
  `;
}

function getExplorerLink(cryptoCurrency: string, transactionId: string): string {
  switch (cryptoCurrency) {
    case 'BTC':
      return `https://blockstream.info/testnet/tx/${transactionId}`;
    case 'ETH':
      return `https://sepolia.etherscan.io/tx/${transactionId}`;
    case 'SOL':
      return `https://explorer.solana.com/tx/${transactionId}?cluster=devnet`;
    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json();
    console.log('Received order data for receipt:', orderData.orderId);
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable not found');
      return NextResponse.json({ error: 'Email service not configured - missing API key' }, { status: 500 });
    }
    
    if (!resend) {
      console.error('Resend client failed to initialize');
      return NextResponse.json({ error: 'Email service not configured - client error' }, { status: 500 });
    }

    const receiptHTML = generateReceiptHTML(orderData);
    
    console.log('Attempting to send emails...');

    // Send to customer
    console.log('Sending to customer:', orderData.customerEmail);
    const customerEmail = await resend.emails.send({
      from: 'Gemsutopia <orders@gemsutopia.com>',
      to: [orderData.customerEmail],
      subject: `Order Confirmation #${orderData.orderId.slice(-8).toUpperCase()} - Gemsutopia`,
      html: receiptHTML,
    });
    console.log('Customer email result:', customerEmail);

    // Send to admin (gemsutopia@gmail.com)
    console.log('Sending to admin: gemsutopia@gmail.com');
    const adminEmail = await resend.emails.send({
      from: 'Gemsutopia <orders@gemsutopia.com>',
      to: ['gemsutopia@gmail.com'],
      subject: `New Order Received #${orderData.orderId.slice(-8).toUpperCase()}`,
      html: receiptHTML,
    });
    console.log('Admin email result:', adminEmail);

    console.log('Emails sent successfully:', {
      customer: customerEmail.data?.id,
      admin: adminEmail.data?.id
    });

    return NextResponse.json({ 
      success: true, 
      customerEmailId: customerEmail.data?.id,
      adminEmailId: adminEmail.data?.id
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ 
      error: 'Failed to send email receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}