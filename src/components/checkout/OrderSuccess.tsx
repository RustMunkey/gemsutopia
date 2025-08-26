'use client';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initEmailJS, sendOrderReceiptEmail } from '@/lib/emailjs';

interface OrderSuccessProps {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  cryptoAmount?: number;
  currency?: string;
  cryptoCurrency?: string;
  items?: Array<{ 
    id: string;
    name: string; 
    price: number; 
    quantity: number;
    image?: string;
  }>;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  paymentMethod?: string;
  shippingMethod?: 'flat' | 'combined';
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    amount: number;
    free_shipping: boolean;
  };
  taxRate?: number;
  taxLabel?: string;
  cryptoPrices?: any; // For converting individual amounts to crypto
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

export default function OrderSuccess({ 
  orderId, 
  customerEmail, 
  customerName, 
  amount, 
  cryptoAmount, 
  currency = 'CAD', 
  cryptoCurrency, 
  items = [], 
  subtotal, 
  tax, 
  shipping = 0,
  paymentMethod,
  shippingMethod,
  appliedDiscount,
  taxRate,
  taxLabel,
  cryptoPrices, 
  shippingAddress 
}: OrderSuccessProps) {
  
  // Calculate proper amounts for display using passed values
  const calculateDisplayAmounts = () => {
    // Use the actual values passed from CheckoutFlow
    const actualSubtotal = subtotal || (items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);
    const actualTax = tax || 0;
    
    if (cryptoCurrency && cryptoAmount) {
      // For crypto payments: convert amounts to crypto using the conversion ratio
      const fiatTotal = actualSubtotal + actualTax + (shipping || 0);
      const conversionRate = cryptoAmount / (fiatTotal || cryptoAmount);
      return {
        subtotal: actualSubtotal * conversionRate,
        tax: actualTax * conversionRate,
      };
    } else {
      // For fiat payments: use actual values directly
      return {
        subtotal: actualSubtotal,
        tax: actualTax,
      };
    }
  };

  const displayAmounts = calculateDisplayAmounts();
  const [transactionId, setTransactionId] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);



  useEffect(() => {
    // Fetch order details to get transaction ID
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const orderData = await response.json();
          const paymentDetails = orderData.order?.payment_details;
          if (paymentDetails?.payment_id) {
            setTransactionId(paymentDetails.payment_id);
          }
          if (paymentDetails?.wallet_address) {
            setWalletAddress(paymentDetails.wallet_address);
          }
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    // Initialize EmailJS
    initEmailJS();

    // Send order receipt emails (both EmailJS and Resend)
    const sendReceiptEmails = async () => {
      try {
        // Send via EmailJS (existing implementation)
        const emailJSData = {
          customerEmail,
          customerName: customerName || 'Customer',
          orderId,
          amount,
          items,
        };

        const emailJSResult = await sendOrderReceiptEmail(emailJSData);
        
        // Calculate proper amounts based on actual passed values
        const calculateAmounts = () => {
          const actualSubtotal = subtotal || (items.reduce((sum, item) => sum + (item.price * item.quantity), 0));
          const actualTax = tax || 0;
          const actualShipping = shipping || 0;
          const fiatTotal = actualSubtotal + actualTax + actualShipping;
          
          if (cryptoCurrency && cryptoAmount) {
            // For crypto payments: convert all amounts to crypto using the conversion ratio
            const conversionRate = cryptoAmount / fiatTotal;
            return {
              subtotal: actualSubtotal * conversionRate,
              tax: actualTax * conversionRate,
              shipping: actualShipping * conversionRate,
              total: cryptoAmount,
              currency: cryptoCurrency
            };
          } else {
            // For fiat payments: use actual amounts
            return {
              subtotal: actualSubtotal,
              tax: actualTax,
              shipping: actualShipping,
              total: fiatTotal,
              currency: currency || 'CAD'
            };
          }
        };

        const amounts = calculateAmounts();

        // Send via Resend (new professional receipts)
        const resendData = {
          orderId,
          customerEmail,
          customerName: customerName || 'Customer',
          items: items.map(item => {
            if (cryptoCurrency && cryptoAmount) {
              // For crypto: convert individual item price to crypto
              const itemTotalFiat = item.price * item.quantity;
              const itemTotalCrypto = itemTotalFiat * (cryptoAmount / (amounts.total || cryptoAmount));
              const itemPriceCrypto = itemTotalCrypto / item.quantity;
              return {
                name: item.name,
                price: itemPriceCrypto,
                quantity: item.quantity
              };
            } else {
              // For fiat: use original price
              return {
                name: item.name,
                price: item.price,
                quantity: item.quantity
              };
            }
          }),
          subtotal: amounts.subtotal,
          tax: amounts.tax,
          shipping: amounts.shipping,
          total: amounts.total,
          paymentMethod: cryptoCurrency ? 'crypto' : 'standard',
          cryptoAmount,
          cryptoCurrency,
          currency: amounts.currency,
          // Add additional crypto details if available
          transactionId: transactionId || orderId,
          network: cryptoCurrency ? getNetworkName(cryptoCurrency) : undefined,
          walletAddress: walletAddress,
          // Add shipping address
          shippingAddress: shippingAddress,
        };

        const resendResponse = await fetch('/api/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resendData)
        });

        const resendResult = await resendResponse.json();
        
        if (emailJSResult.success || resendResult.success) {
          setEmailSent(true);
        } else {
          setEmailError('Failed to send receipt email');
        }
      } catch (error) {
        console.error('Error sending receipt emails:', error);
        setEmailError('Failed to send receipt email');
      }
    };

    sendReceiptEmails();
  }, [orderId, customerEmail, customerName, amount, items, subtotal, tax, cryptoAmount, cryptoCurrency, currency, shippingAddress]);

  // Helper function to get network name for crypto currencies
  const getNetworkName = (crypto: string) => {
    switch (crypto) {
      case 'BTC': return 'Bitcoin Testnet';
      case 'ETH': return 'Ethereum Sepolia';
      case 'SOL': return 'Solana Devnet';
      default: return 'Testnet';
    }
  };

  useEffect(() => {
    // Simple CSS-based confetti animation instead of external script
    const createConfetti = () => {
      const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
      
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.borderRadius = '50%';
        confetti.style.animation = `confetti-fall ${Math.random() * 2 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          if (document.body.contains(confetti)) {
            document.body.removeChild(confetti);
          }
        }, 4000);
      }
    };

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-10px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Trigger confetti
    createConfetti();
    setTimeout(createConfetti, 200);
    setTimeout(createConfetti, 400);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center relative overflow-hidden">
      <div className="relative z-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Thank you for your purchase. Your order has been successfully placed.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-mono text-sm">{orderId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-sm">{customerEmail}</span>
            </div>
            
            {/* Payment Method */}
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="text-sm">
                {cryptoCurrency ? (
                  `Cryptocurrency (${cryptoCurrency})`
                ) : paymentMethod === 'stripe' ? (
                  'Credit/Debit Card'
                ) : paymentMethod === 'paypal' ? (
                  'PayPal'
                ) : (
                  'Card Payment'
                )}
              </span>
            </div>
            
            {/* Order Breakdown */}
            {(subtotal !== undefined || items.length > 0) && (
              <>
                <div className="border-t border-gray-200 pt-3 mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Order Breakdown:</div>
                  
                  {/* Items with Images */}
                  {items.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Products Ordered:</div>
                      {items.map((item, index) => {
                        const itemTotal = item.price * item.quantity;
                        const itemCryptoTotal = cryptoCurrency && cryptoAmount ? 
                          (itemTotal * (cryptoAmount / (displayAmounts.subtotal + displayAmounts.tax))) : 
                          itemTotal;
                        
                        return (
                          <div key={item.id || index} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-100">
                            {item.image && (
                              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <span className="text-sm font-medium">
                                  {cryptoCurrency ? 
                                    `${itemCryptoTotal.toFixed(8)} ${cryptoCurrency}` : 
                                    `$${itemTotal.toFixed(2)} ${currency}`
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Financial breakdown */}
                  <div className="space-y-2 text-sm border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>
                        {cryptoCurrency ? 
                          `${displayAmounts.subtotal.toFixed(8)} ${cryptoCurrency}` : 
                          `$${displayAmounts.subtotal.toFixed(2)} ${currency}`
                        }
                      </span>
                    </div>
                    
                    {/* Discount */}
                    {appliedDiscount && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedDiscount.code}):</span>
                        <span>
                          -{cryptoCurrency ? 
                            `${(appliedDiscount.amount * (cryptoAmount || 1) / amount).toFixed(8)} ${cryptoCurrency}` : 
                            `$${appliedDiscount.amount.toFixed(2)} ${currency}`
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Shipping */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Shipping {shippingMethod && `(${shippingMethod === 'flat' ? 'Flat Rate' : 'Combined'})`}:
                      </span>
                      <span>
                        {appliedDiscount?.free_shipping ? (
                          <span className="text-green-600">FREE</span>
                        ) : (shipping || 0) === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : cryptoCurrency ? 
                          `${(((shipping || 0) * (cryptoAmount || 1)) / amount).toFixed(8)} ${cryptoCurrency}` : 
                          `$${(shipping || 0).toFixed(2)} ${currency}`
                        }
                      </span>
                    </div>
                    
                    {/* Tax */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {taxLabel || 'Tax'} {taxRate && `(${(taxRate * 100).toFixed(1)}%)`}:
                      </span>
                      <span>
                        {cryptoCurrency ? 
                          ((tax || 0) === 0 ? 'Tax Free (Crypto)' : `${(((tax || 0) * (cryptoAmount || 1)) / amount).toFixed(8)} ${cryptoCurrency}`) :
                          `$${(tax || 0).toFixed(2)} ${currency}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Total amount with proper formatting */}
            <div className="flex justify-between border-t border-gray-300 pt-3 mt-3">
              <span className="text-gray-900 font-semibold">Total Paid:</span>
              <span className="font-bold text-lg">
                {cryptoCurrency && cryptoAmount ? (
                  <div className="text-right">
                    <div>{cryptoAmount.toFixed(6)} {cryptoCurrency}</div>
                    <div className="text-sm text-gray-500 font-normal">
                      (${amount.toFixed(2)} {currency})
                    </div>
                  </div>
                ) : (
                  `$${amount.toFixed(2)} ${currency}`
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="text-green-600 font-medium">✓ Paid</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-3">
              <Package className="h-6 w-6 text-gray-600 mr-3" />
              <h3 className="font-semibold text-gray-900">Shipping Address</h3>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
              <p>{shippingAddress.address}</p>
              {shippingAddress.apartment && <p>Apt/Suite: {shippingAddress.apartment}</p>}
              <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
              <p>{shippingAddress.country}</p>
              {shippingAddress.phone && <p>Phone: {shippingAddress.phone}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`border rounded-lg p-6 ${
            emailSent 
              ? 'bg-green-50 border-green-200' 
              : emailError 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center mb-3">
              <Mail className={`h-6 w-6 mr-3 ${
                emailSent 
                  ? 'text-green-600' 
                  : emailError 
                    ? 'text-red-600' 
                    : 'text-blue-600'
              }`} />
              <h3 className={`font-semibold ${
                emailSent 
                  ? 'text-green-900' 
                  : emailError 
                    ? 'text-red-900' 
                    : 'text-blue-900'
              }`}>
                Email Confirmation
              </h3>
            </div>
            <p className={`text-sm ${
              emailSent 
                ? 'text-green-800' 
                : emailError 
                  ? 'text-red-800' 
                  : 'text-blue-800'
            }`}>
              {emailSent 
                ? `✓ Order confirmation and receipt sent to ${customerEmail}`
                : emailError 
                  ? `⚠ ${emailError}. Please contact support if you don't receive your receipt.`
                  : `Sending order confirmation and receipt to ${customerEmail}...`
              }
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Package className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="font-semibold text-purple-900">Shipping Update</h3>
            </div>
            <p className="text-purple-800 text-sm">
              You'll receive tracking information once your order ships (typically 1-2 business days)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
          
          <a
            href="/support"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:gemsutopia@gmail.com" className="text-black hover:underline">
              gemsutopia@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}