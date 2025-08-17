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
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p class="success">✅ Payment Confirmed</p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)} ${order.currency}</td>
              <td>$${(item.price * item.quantity).toFixed(2)} ${order.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>$${order.subtotal.toFixed(2)} ${order.currency}</span>
        </div>
        <div class="total-row">
          <span>Shipping:</span>
          <span>${order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)} ${order.currency}`}</span>
        </div>
        <div class="total-row">
          <span>Tax (HST):</span>
          <span>$${order.tax.toFixed(2)} ${order.currency}</span>
        </div>
        <div class="total-row total-final">
          <span>Total Paid:</span>
          <span>$${order.total.toFixed(2)} ${order.currency}</span>
        </div>
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
    
    if (!resend || !process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const receiptHTML = generateReceiptHTML(orderData);
    
    // Send to customer
    const customerEmail = await resend.emails.send({
      from: 'Gemsutopia <orders@gemsutopia.com>',
      to: [orderData.customerEmail],
      subject: `Order Confirmation #${orderData.orderId.slice(-8).toUpperCase()} - Gemsutopia`,
      html: receiptHTML,
    });

    // Send to admin (gemsutopia@gmail.com)
    const adminEmail = await resend.emails.send({
      from: 'Gemsutopia <orders@gemsutopia.com>',
      to: ['gemsutopia@gmail.com'],
      subject: `New Order Received #${orderData.orderId.slice(-8).toUpperCase()}`,
      html: receiptHTML,
    });

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