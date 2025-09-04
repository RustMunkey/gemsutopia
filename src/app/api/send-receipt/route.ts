import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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
  paymentMethod?: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  currency: string;
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
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .success { color: #28a745; font-weight: bold; }
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
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td><strong>${item.name}</strong><br><small style="color: #666;">Premium ethically sourced gemstone</small></td>
                <td style="text-align: center;"><strong>${item.quantity}</strong></td>
                <td style="text-align: right;">$${item.price.toFixed(2)} ${order.currency}</td>
                <td style="text-align: right;"><strong>$${(item.price * item.quantity).toFixed(2)} ${order.currency}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">💰 Order Summary</h3>
        <div class="total-row">
          <span style="color: #666;">Subtotal:</span>
          <span style="font-weight: 500;">$${order.subtotal.toFixed(2)} ${order.currency}</span>
        </div>
        <div class="total-row">
          <span style="color: #666;">Tax:</span>
          <span style="font-weight: 500;">$${order.tax.toFixed(2)} ${order.currency}</span>
        </div>
        <div class="total-row">
          <span style="color: #666;">Shipping:</span>
          <span style="font-weight: 500;">$${order.shipping.toFixed(2)} ${order.currency}</span>
        </div>
        <div class="total-row total-final">
          <span>TOTAL PAID:</span>
          <span style="color: #000;">$${order.total.toFixed(2)} ${order.currency}</span>
        </div>
      </div>

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

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json();
    console.log('Received order data for receipt:', orderData.orderId);
    
    // Check if Resend API key is available
    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API key not found. Please set RESEND_API_KEY in .env.local');
      return NextResponse.json({ 
        error: 'Email service not configured - missing Resend API key',
        success: false
      });
    }

    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    const receiptHTML = generateReceiptHTML(orderData);
    
    console.log('Sending emails via Resend...');
    console.log('Customer email:', orderData.customerEmail);
    console.log('Order ID:', orderData.orderId);

    // Send to customer
    const customerResult = await resend.emails.send({
      from: 'Gemsutopia <orders@gemsutopia.com>',
      to: [orderData.customerEmail],
      subject: `Order Confirmation #${orderData.orderId.slice(-8).toUpperCase()} - Gemsutopia`,
      html: receiptHTML,
    });

    // Send to admin (gemsutopia@gmail.com)
    const adminResult = await resend.emails.send({
      from: 'Gemsutopia <orders@gemsutopia.com>',
      to: ['gemsutopia@gmail.com'],
      subject: `New Order Received #${orderData.orderId.slice(-8).toUpperCase()}`,
      html: receiptHTML,
    });

    console.log('Emails sent successfully via Resend:', {
      customer: customerResult.data?.id,
      admin: adminResult.data?.id
    });

    return NextResponse.json({ 
      success: true, 
      customerEmailId: customerResult.data?.id,
      adminEmailId: adminResult.data?.id,
      message: 'Receipt sent to both customer and admin'
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ 
      error: 'Failed to send email receipt',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}