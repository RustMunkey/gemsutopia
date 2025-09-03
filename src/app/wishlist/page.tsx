'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IconTrash } from '@tabler/icons-react';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useInventory } from '@/contexts/InventoryContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Wishlist() {
  const { items, removeItem, addItem: addToWishlist, clearWishlist } = useWishlist();
  const { addItem: addToGemPouch, removeItem: removeFromGemPouch, isInPouch } = useGemPouch();
  const { formatPrice } = useCurrency();
  const { showNotification } = useNotification();
  const { productRefreshTrigger } = useInventory();
  const [itemsWithCurrentInventory, setItemsWithCurrentInventory] = useState(items);
  
  // Fetch current inventory data for wishlist items
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
        
        // Update wishlist items with current inventory
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

  const addAllToCart = () => {
    const addedItems: any[] = [];
    itemsWithCurrentInventory.forEach(item => {
      if (!isInPouch(item.id) && item.inventory > 0) {
        addToGemPouch(item);
        removeItem(item.id);
        addedItems.push(item);
      }
    });
    if (addedItems.length > 0) {
      showNotification('success', `Moved ${addedItems.length} items to cart and removed from wishlist`);
    }
  };

  const handleRemoveFromWishlist = (item: any) => {
    removeItem(item.id);
    showNotification('success', `${item.name} removed from wishlist`, {
      label: 'Undo',
      onClick: () => {
        addToWishlist(item);
        showNotification('success', `${item.name} restored to wishlist`);
      }
    });
  };

  const handleRemoveFromGemPouch = (item: any) => {
    removeFromGemPouch(item.id);
    showNotification('success', `${item.name} removed from gem pouch`, {
      label: 'Undo',
      onClick: () => {
        addToGemPouch(item);
        showNotification('success', `${item.name} restored to gem pouch`);
      }
    });
  };

  const handleClearWishlist = () => {
    const itemsToRestore = [...items]; // Store current items
    clearWishlist();
    showNotification('success', `Cleared ${itemsToRestore.length} items from wishlist`, {
      label: 'Undo',
      onClick: () => {
        itemsToRestore.forEach(item => addToWishlist(item));
        showNotification('success', `Restored ${itemsToRestore.length} items to wishlist`);
      }
    });
  };

  const toggleGemPouch = (item: any) => {
    // Don't allow cart actions for sold out items
    if (item.inventory === 0 || item.stock === 0) {
      showNotification('error', `${item.name} is currently sold out`);
      return;
    }
    
    if (isInPouch(item.id)) {
      handleRemoveFromGemPouch(item);
    } else {
      addToGemPouch(item);
      // Remove from wishlist when added to cart
      removeItem(item.id);
      showNotification('success', `${item.name} moved to cart and removed from wishlist`);
    }
  };
  
  const availableItems = itemsWithCurrentInventory.filter(item => !isInPouch(item.id) && item.inventory > 0);
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
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Wishlist</h1>
              <p className="text-lg text-neutral-600">Your saved gemstones and jewelry</p>
              
              {itemsWithCurrentInventory.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  {availableItems.length > 0 && (
                    <button
                      onClick={addAllToCart}
                      className="inline-flex items-center justify-center bg-black text-white py-3 px-6 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add All to Cart ({availableItems.length})
                    </button>
                  )}
                  <button
                    onClick={handleClearWishlist}
                    className="inline-flex items-center justify-center border border-red-500 text-red-500 py-3 px-6 rounded-full font-semibold hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <IconTrash className="h-5 w-5 mr-2" />
                    Clear Wishlist
                  </button>
                </div>
              )}
            </div>
          
          {itemsWithCurrentInventory.length === 0 ? (
            /* Empty wishlist state */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6" style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'}}>
                <Star className="h-10 w-10 text-black" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-black mb-4">Your wishlist is empty</h2>
              <p className="text-neutral-600 mb-8">Save your favorite gems to your wishlist for easy access.</p>
              
              <Link
                href="/shop"
                className="inline-block bg-black text-white py-3 px-8 rounded-full font-semibold hover:bg-neutral-800 transition-colors"
              >
                Discover Gems
              </Link>
            </div>
          ) : (
            /* Items in wishlist */
            <div>
              {/* Mobile: Product Cards Single Column */}
              <div className="md:hidden flex flex-col gap-4">
                {itemsWithCurrentInventory.map((item) => (
                  <div key={`mobile-${item.id}`} 
                    className="rounded-2xl p-2 shadow-2xl shadow-white/20 border border-white/10 translate-x-1 translate-y-1 transition-all duration-200 ease-out product-card select-none h-full flex flex-col max-w-xs mx-auto"
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
                        sizes="(max-width: 768px) 280px, 33vw"
                        quality={75}
                      />
                      {/* Sold Out Overlay */}
                      {(item.inventory === 0 || item.stock === 0) && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="text-white font-bold text-2xl tracking-wider">SOLD</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 z-10">
                        <Image 
                          src="/logos/gems-logo.png" 
                          alt="Gemsutopia"
                          width={32}
                          height={32}
                          className="h-8 opacity-70 object-contain"
                        />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-black mb-1 text-center min-h-[3rem] flex items-center justify-center leading-tight">{item.name}</h3>
                    
                    <div className="text-center mb-2">
                      <span className="text-lg font-bold text-black">{formatPrice(item.price)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between relative">
                      <button
                        onClick={() => handleRemoveFromWishlist(item)}
                        className={`transition-colors p-1 text-red-600 hover:text-red-800`}
                        title="Remove from wishlist"
                      >
                        <IconTrash className="h-5 w-5" strokeWidth={2} />
                      </button>
                      
                      <button
                        onClick={() => toggleGemPouch(item)}
                        className={`transition-colors p-1 relative ${
                          (item.inventory === 0 || item.stock === 0) 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-black hover:text-neutral-600'
                        }`}
                        title={(item.inventory === 0 || item.stock === 0) ? 'Item is sold out - cannot add to cart' : (isInPouch(item.id) ? 'Remove from gem pouch' : 'Add to gem pouch')}
                        disabled={(item.inventory === 0 || item.stock === 0)}
                      >
                        <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                        {isInPouch(item.id) && !(item.inventory === 0 || item.stock === 0) && (
                          <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop: List View (unchanged) */}
              <div className="hidden md:grid gap-6">
                {itemsWithCurrentInventory.map((item) => (
                  <div key={`desktop-${item.id}`} className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-6">
                    <div className="w-24 h-24 bg-neutral-100 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      {(item.inventory === 0 || item.stock === 0) && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                          <span className="text-white font-bold text-sm tracking-wider">SOLD</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-black mb-2">{item.name}</h3>
                      <p className="text-lg font-bold text-black">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleGemPouch(item)}
                        className={`transition-all p-2 relative ${
                          (item.inventory === 0 || item.stock === 0) 
                            ? 'text-neutral-300 cursor-not-allowed opacity-50' 
                            : 'text-black hover:text-neutral-600 hover:scale-110'
                        }`}
                        title={(item.inventory === 0 || item.stock === 0) ? 'Item is sold out - cannot add to cart' : (isInPouch(item.id) ? 'Remove from gem pouch' : 'Add to gem pouch')}
                        disabled={(item.inventory === 0 || item.stock === 0)}
                      >
                        <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                        {isInPouch(item.id) && !(item.inventory === 0 || item.stock === 0) && (
                          <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(item)}
                        className="text-red-600 hover:text-red-800 transition-colors p-2"
                        title="Remove from wishlist"
                      >
                        <IconTrash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
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