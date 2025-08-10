'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IconTrash } from '@tabler/icons-react';
import { Star, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useGemPouch } from '@/contexts/GemPouchContext';
import Image from 'next/image';
import Link from 'next/link';

export default function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem: addToGemPouch, isInPouch } = useGemPouch();
  return (
    <div className="min-h-screen flex flex-col relative">
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
      
      <Header />
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Wishlist</h1>
              <p className="text-lg text-neutral-600">Your saved gemstones and jewelry</p>
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
                    <p className="text-lg font-bold text-black">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => addToGemPouch(item)}
                      disabled={isInPouch(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isInPouch(item.id) 
                          ? 'text-green-600 bg-green-100 cursor-not-allowed' 
                          : 'text-black hover:bg-neutral-100'
                      }`}
                      title={isInPouch(item.id) ? 'Already in gem pouch' : 'Add to gem pouch'}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 p-2"
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