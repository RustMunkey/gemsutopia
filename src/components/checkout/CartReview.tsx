'use client';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Trash2, Plus, Minus } from 'lucide-react';
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
}

export default function CartReview({ items, onContinue }: CartReviewProps) {
  const { removeItem, updateQuantity } = useGemPouch();
  const { formatPrice } = useCurrency();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
                <span className="text-sm text-gray-600">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-2 min-w-[3rem] text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.stock ? item.quantity >= item.stock : false}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {item.stock && (
                  <span className="text-xs text-gray-500">
                    {item.stock - item.quantity} left
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
            
            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>Subtotal ({totalItemCount} items)</span>
          <span>{formatPrice(subtotal)}</span>
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