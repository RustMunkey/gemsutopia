'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IconTrash } from '@tabler/icons-react';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotification } from '@/contexts/NotificationContext';
import Image from 'next/image';
import Link from 'next/link';

export default function Wishlist() {
  const { items, removeItem, addItem: addToWishlist, clearWishlist } = useWishlist();
  const { addItem: addToGemPouch, removeItem: removeFromGemPouch, isInPouch } = useGemPouch();
  const { formatPrice } = useCurrency();
  const { showNotification } = useNotification();
  
  const addAllToCart = () => {
    items.forEach(item => {
      if (!isInPouch(item.id)) {
        addToGemPouch(item);
      }
    });
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
    if (isInPouch(item.id)) {
      handleRemoveFromGemPouch(item);
    } else {
      addToGemPouch(item);
    }
  };
  
  const availableItems = items.filter(item => !isInPouch(item.id));
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
              
              {items.length > 0 && (
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
          
          {items.length === 0 ? (
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
            <div className="grid gap-6">
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
                    <p className="text-lg font-bold text-black">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleGemPouch(item)}
                      className="text-black hover:text-neutral-600 transition-colors p-1 relative"
                      title={isInPouch(item.id) ? 'Remove from gem pouch' : 'Add to gem pouch'}
                    >
                      <ShoppingBag className="h-6 w-6" strokeWidth={2} />
                      {isInPouch(item.id) && (
                        <Check className="absolute bottom-0 right-0 h-4 w-4 text-green-500" strokeWidth={4} />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Remove from wishlist"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
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