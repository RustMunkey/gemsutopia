'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IconTrash } from '@tabler/icons-react';
import { ShoppingBag } from 'lucide-react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useInventory } from '@/contexts/InventoryContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function GemPouch() {
  const { items, removeItem, addItem, updateQuantity, clearPouch } = useGemPouch();
  const { formatPrice } = useCurrency();
  const { showNotification } = useNotification();
  const { productRefreshTrigger } = useInventory();
  const [itemsWithCurrentInventory, setItemsWithCurrentInventory] = useState(items);
  const totalPrice = itemsWithCurrentInventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Fetch current inventory data for cart items
  useEffect(() => {
    const fetchCurrentInventory = async () => {
      if (items.length === 0) {
        setItemsWithCurrentInventory([]);
        return;
      }

      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          console.error('Failed to fetch product data');
          setItemsWithCurrentInventory(items);
          return;
        }
        
        const data = await response.json();
        const products = data.products || [];
        
        // Create a map of current inventory by product ID
        const inventoryMap = new Map();
        products.forEach((product: any) => {
          inventoryMap.set(product.id, product.inventory || 0);
        });
        
        // Update cart items with current inventory
        const updatedItems = items.map(item => ({
          ...item,
          inventory: inventoryMap.get(item.id) ?? item.inventory ?? 0
        }));
        
        setItemsWithCurrentInventory(updatedItems);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setItemsWithCurrentInventory(items);
      }
    };

    fetchCurrentInventory();
  }, [items, productRefreshTrigger]);

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
          
          {itemsWithCurrentInventory.length === 0 ? (
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
              {/* Mobile: Product Cards Grid */}
              <div className="md:hidden grid grid-cols-2 gap-4 mb-8">
                {itemsWithCurrentInventory.map((item) => (
                  <div key={`mobile-${item.id}`} 
                    className="rounded-2xl p-2 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out product-card select-none h-full flex flex-col"
                    style={{ backgroundColor: '#f0f0f0' }}
                  >
                    <div className="aspect-square bg-neutral-100 rounded-lg mb-2 overflow-hidden relative">
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        fill
                        className="object-cover select-none pointer-events-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        sizes="(max-width: 768px) 50vw, 33vw"
                        quality={75}
                      />
                      {/* Sold Out Overlay */}
                      {item.inventory === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="text-white font-bold text-lg tracking-wider">SOLD</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 z-10">
                        <Image 
                          src="/logos/gems-logo.png" 
                          alt="Gemsutopia"
                          width={24}
                          height={24}
                          className="h-6 opacity-70 object-contain"
                        />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-black mb-1 text-center min-h-[2.5rem] flex items-center justify-center leading-tight">{item.name}</h3>
                    <div className="text-center mb-2">
                      <span className="text-sm font-bold text-black">{formatPrice(item.price * item.quantity)}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-gray-600 ml-1">({item.quantity}x)</span>
                      )}
                    </div>
                    
                    {/* Mobile Quantity Controls */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-black font-bold text-sm"
                      >
                        −
                      </button>
                      <span className="text-xs font-medium text-black min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.inventory !== undefined ? item.quantity >= item.inventory : (item.stock ? item.quantity >= item.stock : false)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-black font-bold text-sm ${
                          (item.inventory !== undefined ? item.quantity >= item.inventory : (item.stock && item.quantity >= item.stock))
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-600 py-1 px-2 rounded-lg transition-colors text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Desktop: List View */}
              <div className="hidden md:grid gap-6 mb-8">
                {itemsWithCurrentInventory.map((item) => (
                  <div key={`desktop-${item.id}`} className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-6">
                    <div className="w-28 h-28 bg-neutral-100 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                      {/* Sold Out Overlay */}
                      {item.inventory === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="text-white font-bold text-sm tracking-wider">SOLD</span>
                        </div>
                      )}
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
                          {(item.inventory !== undefined || item.stock) && (
                            <span className="text-gray-500 text-sm ml-2">
                              (of {item.inventory ?? item.stock})
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.inventory !== undefined ? item.quantity >= item.inventory : (item.stock ? item.quantity >= item.stock : false)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-black font-bold ${
                            (item.inventory !== undefined ? item.quantity >= item.inventory : (item.stock && item.quantity >= item.stock))
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          +
                        </button>
                      </div>
                      {((item.inventory !== undefined && item.quantity >= item.inventory) || (item.stock && item.quantity >= item.stock)) && (
                        <p className="text-sm text-orange-600 mt-1">
                          Maximum stock reached
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2"
                        title="Remove from gem pouch"
                      >
                        <IconTrash className="h-5 w-5" />
                      </button>
                    </div>
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