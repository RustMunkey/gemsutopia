'use client';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';

interface CartReviewProps {
  items: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  onContinue: () => void;
}

export default function CartReview({ items, onContinue }: CartReviewProps) {
  const { removeItem } = useGemPouch();
  const { formatPrice } = useCurrency();

  // Group items by ID and count quantities
  const groupedItems = items.reduce((acc, item) => {
    const existingItem = acc.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      acc.push({ ...item, quantity: 1 });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; price: number; image: string; quantity: number }>);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Items</h2>
      
      <div className="space-y-4 mb-8">
        {groupedItems.map((item) => (
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
              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              <p className="text-lg font-semibold text-gray-900">
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
          <span>Subtotal ({items.length} items)</span>
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