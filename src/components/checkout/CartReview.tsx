'use client';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Trash2, Tag, X, Check } from 'lucide-react';
import Image from 'next/image';

interface CartReviewProps {
  items: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    stock?: number;
  }>;
  onContinue: () => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  appliedDiscount: {
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    amount: number;
    free_shipping: boolean;
  } | null;
  discountError: string;
  validateDiscountCode: () => void;
  removeDiscount: () => void;
}

export default function CartReview({ 
  items, 
  onContinue,
  discountCode,
  setDiscountCode,
  appliedDiscount,
  discountError,
  validateDiscountCode,
  removeDiscount
}: CartReviewProps) {
  const { removeItem, updateQuantity, addItem } = useGemPouch();
  const { formatPrice } = useCurrency();
  const { showNotification } = useNotification();

  const handleQuantityDecrease = (itemId: string, currentQuantity: number, itemName: string) => {
    if (currentQuantity <= 1) {
      // Remove item directly and show notification like gem pouch
      const item = items.find(i => i.id === itemId);
      if (item) {
        const originalQuantity = item.quantity;
        removeItem(itemId);
        showNotification('success', `${itemName} removed from your gem pouch`, {
          label: 'Undo',
          onClick: () => {
            // Restore the item with original quantity like gem pouch does
            addItem(item);
            // Set the quantity back to what it was
            if (originalQuantity > 1) {
              setTimeout(() => updateQuantity(itemId, originalQuantity), 100);
            }
            showNotification('success', `${itemName} restored to gem pouch`);
          }
        });
      }
    } else {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  const handleDirectRemoval = (itemId: string, itemName: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const originalQuantity = item.quantity;
      removeItem(itemId);
      showNotification('success', `${itemName} removed from your gem pouch`, {
        label: 'Undo',
        onClick: () => {
          // Restore the item with original quantity like gem pouch does
          addItem(item);
          // Set the quantity back to what it was
          if (originalQuantity > 1) {
            setTimeout(() => updateQuantity(itemId, originalQuantity), 100);
          }
          showNotification('success', `${itemName} restored to gem pouch`);
        }
      });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate totals with discount
  const discount = appliedDiscount?.amount || 0;
  const subtotalAfterDiscount = subtotal - discount;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Items</h2>
      
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 relative">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover rounded-lg"
                sizes="80px"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => handleQuantityDecrease(item.id, item.quantity, item.name)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-black font-bold"
                >
                  −
                </button>
                <span className="font-medium text-black">
                  Qty: {item.quantity}
                  {item.stock && (
                    <span className="text-gray-500 text-sm ml-2">
                      (of {item.stock})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.stock ? item.quantity >= item.stock : false}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-black font-bold ${
                    item.stock && item.quantity >= item.stock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  +
                </button>
              </div>
              {item.stock && item.quantity >= item.stock && (
                <p className="text-sm text-orange-600 mt-1">
                  Maximum stock reached
                </p>
              )}
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            
            <button
              onClick={() => handleDirectRemoval(item.id, item.name)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Discount Code Section */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Discount Code</h3>
        
        {appliedDiscount ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Code "{appliedDiscount.code}" applied
                  </p>
                  <p className="text-xs text-green-600">
                    {appliedDiscount.type === 'percentage' 
                      ? `${appliedDiscount.value}% off`
                      : `${formatPrice(appliedDiscount.value)} off`
                    }
                    {appliedDiscount.free_shipping && ' + Free shipping'}
                  </p>
                </div>
              </div>
              <button
                onClick={removeDiscount}
                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                title="Remove discount"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter discount code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && validateDiscountCode()}
                />
              </div>
              <button
                onClick={validateDiscountCode}
                disabled={!discountCode.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Tag className="h-4 w-4" />
                <span>Apply</span>
              </button>
            </div>
            {discountError && (
              <p className="text-sm text-red-600">{discountError}</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({totalItemCount} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({appliedDiscount.code})</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
            <span>Order Total</span>
            <span>{formatPrice(subtotalAfterDiscount)}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Shipping and taxes calculated at next step
        </p>
      </div>

      <button
        onClick={onContinue}
        disabled={items.length === 0}
        className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Continue to Shipping
      </button>

    </div>
  );
}