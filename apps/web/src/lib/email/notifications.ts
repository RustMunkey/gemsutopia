// Email notification functions for Gemsutopia
// These functions combine templates with the send utility

import {
  sendToCustomer,
  sendToAdmin,
  sendToCustomerAndAdmin,
  SendEmailResult,
  OrderData,
  AuctionData,
  orderConfirmationEmail,
  orderReceivedAdminEmail,
  shippingConfirmationEmail,
  paymentFailedEmail,
  orderCancelledEmail,
  refundProcessedEmail,
  bidConfirmationEmail,
  outbidNotificationEmail,
  auctionWonEmail,
  auctionEndedNoWinnerEmail,
  contactFormConfirmationEmail,
  contactFormAdminEmail,
} from '@gemsutopia/email';

// ============================================================================
// ORDER NOTIFICATIONS
// ============================================================================

export async function notifyOrderConfirmed(
  order: OrderData
): Promise<{ customer: SendEmailResult; admin: SendEmailResult }> {
  const orderId = order.orderId.slice(-8).toUpperCase();

  return sendToCustomerAndAdmin(
    order.customerEmail,
    `Order Confirmation #${orderId} - Gemsutopia`,
    orderConfirmationEmail(order),
    `New Order Received #${orderId} - $${order.total.toFixed(2)}`,
    orderReceivedAdminEmail(order)
  );
}

export async function notifyOrderShipped(
  order: OrderData
): Promise<SendEmailResult> {
  const orderId = order.orderId.slice(-8).toUpperCase();

  return sendToCustomer(
    order.customerEmail,
    `Your Order #${orderId} Has Shipped! - Gemsutopia`,
    shippingConfirmationEmail(order)
  );
}

export async function notifyPaymentFailed(
  order: OrderData,
  reason?: string
): Promise<SendEmailResult> {
  const orderId = order.orderId.slice(-8).toUpperCase();

  return sendToCustomer(
    order.customerEmail,
    `Payment Issue with Order #${orderId} - Gemsutopia`,
    paymentFailedEmail(order, reason)
  );
}

export async function notifyOrderCancelled(
  order: OrderData,
  reason?: string
): Promise<{ customer: SendEmailResult; admin: SendEmailResult }> {
  const orderId = order.orderId.slice(-8).toUpperCase();

  return sendToCustomerAndAdmin(
    order.customerEmail,
    `Order #${orderId} Cancelled - Gemsutopia`,
    orderCancelledEmail(order, reason),
    `Order #${orderId} Cancelled`,
    orderCancelledEmail(order, reason)
  );
}

export async function notifyRefundProcessed(
  order: OrderData,
  refundAmount: number
): Promise<SendEmailResult> {
  const orderId = order.orderId.slice(-8).toUpperCase();

  return sendToCustomer(
    order.customerEmail,
    `Refund Processed for Order #${orderId} - Gemsutopia`,
    refundProcessedEmail(order, refundAmount)
  );
}

// ============================================================================
// AUCTION NOTIFICATIONS
// ============================================================================

export async function notifyBidPlaced(
  customerName: string,
  customerEmail: string,
  auction: AuctionData
): Promise<SendEmailResult> {
  return sendToCustomer(
    customerEmail,
    `Bid Confirmed: ${auction.title} - Gemsutopia`,
    bidConfirmationEmail(customerName, customerEmail, auction)
  );
}

export async function notifyOutbid(
  customerName: string,
  customerEmail: string,
  auction: AuctionData
): Promise<SendEmailResult> {
  return sendToCustomer(
    customerEmail,
    `You've Been Outbid: ${auction.title} - Gemsutopia`,
    outbidNotificationEmail(customerName, customerEmail, auction)
  );
}

export async function notifyAuctionWon(
  customerName: string,
  customerEmail: string,
  auction: AuctionData
): Promise<{ customer: SendEmailResult; admin: SendEmailResult }> {
  return sendToCustomerAndAdmin(
    customerEmail,
    `Congratulations! You Won: ${auction.title} - Gemsutopia`,
    auctionWonEmail(customerName, customerEmail, auction),
    `Auction Won: ${auction.title} by ${customerName}`,
    `<p>Auction <strong>${auction.title}</strong> won by ${customerName} (${customerEmail}) for $${auction.userBid.toFixed(2)}</p>`
  );
}

export async function notifyAuctionLost(
  customerName: string,
  customerEmail: string,
  auction: AuctionData
): Promise<SendEmailResult> {
  return sendToCustomer(
    customerEmail,
    `Auction Ended: ${auction.title} - Gemsutopia`,
    auctionEndedNoWinnerEmail(customerName, customerEmail, auction)
  );
}

// ============================================================================
// CONTACT NOTIFICATIONS
// ============================================================================

export async function notifyContactFormSubmitted(
  customerName: string,
  customerEmail: string,
  subject: string,
  message: string
): Promise<{ customer: SendEmailResult; admin: SendEmailResult }> {
  return sendToCustomerAndAdmin(
    customerEmail,
    `We Received Your Message - Gemsutopia`,
    contactFormConfirmationEmail(customerName, customerEmail, subject, message),
    `Contact Form: ${subject} from ${customerName}`,
    contactFormAdminEmail(customerName, customerEmail, subject, message)
  );
}
