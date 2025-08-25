'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IconTrash } from '@tabler/icons-react';
import { ShoppingBag } from 'lucide-react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotification } from '@/contexts/NotificationContext';
import Image from 'next/image';
import Link from 'next/link';

export default function GemPouch() {
  const { items, removeItem, addItem, updateQuantity, clearPouch } = useGemPouch();
  const { formatPrice } = useCurrency();
  const { showNotification } = useNotification();
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRemoveItem = (item: any) => {
    const originalQuantity = item.quantity;
    removeItem(item.id);
    showNotification('success', `${item.name} removed from gem pouch`, {
      label: 'Undo',
      onClick: () => {
        // Restore the item with original quantity
        addItem(item);
        // Set the quantity back to what it was
        if (originalQuantity > 1) {
          setTimeout(() => updateQuantity(item.id, originalQuantity), 100);
        }
        showNotification('success', `${item.name} restored to gem pouch`);
      }
    });
  };

  const handleClearGemPouch = () => {
    const itemsToRestore = [...items]; // Store current items with quantities
    clearPouch();
    const totalItemCount = itemsToRestore.reduce((sum, item) => sum + item.quantity, 0);
    showNotification('success', `Cleared ${totalItemCount} items from gem pouch`, {
      label: 'Undo',
      onClick: () => {
        itemsToRestore.forEach(item => {
          addItem(item);
          if (item.quantity > 1) {
            setTimeout(() => updateQuantity(item.id, item.quantity), 100);
          }
        });
        showNotification('success', `Restored ${totalItemCount} items to gem pouch`);
      }
    });
  };

  return (
    <div className="min-h-[200vh] flex flex-col relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <div className="relative z-10">
        <Header />
      </div>
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Gem Pouch</h1>
            <p className="text-lg text-neutral-600">Review your selected items</p>
          </div>
          
          {items.length === 0 ? (
            /* Empty cart state */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6" style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'}}>
                <ShoppingBag className="h-10 w-10 text-black" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-black mb-4">Your gem pouch is empty</h2>
              <p className="text-neutral-600 mb-8">Looks like you haven&apos;t added any gems to your pouch yet.</p>
              
              <Link
                href="/"
                className="inline-block bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            /* Items in cart */
            <div>
              <div className="grid gap-6 mb-8">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-6">
                    <div className="w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden relative">
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-black mb-2">{item.name}</h3>
                      <p className="text-lg font-bold text-black">{formatPrice(item.price * item.quantity)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
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
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Total and Checkout */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-semibold text-black">Total:</span>
                  <span className="text-2xl font-bold text-black">{formatPrice(totalPrice)}</span>
                </div>
                <Link href="/checkout" className="block w-full bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-neutral-800 transition-colors text-center mb-3">
                  Proceed to Checkout
                </Link>
                <button
                  onClick={handleClearGemPouch}
                  className="w-full border border-red-500 text-red-500 py-3 px-8 rounded-full font-semibold hover:bg-red-500 hover:text-white transition-colors"
                >
                  Clear Gem Pouch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}