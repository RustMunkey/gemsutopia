'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShoppingCart, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';

interface WishlistItem {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  inStock: boolean;
  dateAdded: string;
}

export default function UserWishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: '1',
      name: 'Amethyst Crystal Cluster',
      price: '$89.99',
      originalPrice: '$99.99',
      image: '/images/products/amethyst.jpg',
      inStock: true,
      dateAdded: '2025-01-10'
    },
    {
      id: '2',
      name: 'Rose Quartz Heart',
      price: '$45.50',
      image: '/images/products/rose-quartz.jpg',
      inStock: true,
      dateAdded: '2025-01-08'
    },
    {
      id: '3',
      name: 'Rare Moldavite Specimen',
      price: '$299.99',
      image: '/images/products/moldavite.jpg',
      inStock: false,
      dateAdded: '2025-01-05'
    },
    {
      id: '4',
      name: 'Citrine Abundance Set',
      price: '$156.00',
      image: '/images/products/citrine.jpg',
      inStock: true,
      dateAdded: '2025-01-03'
    }
  ]);

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems(items => items.filter(item => item.id !== itemId));
  };

  const addToCart = (item: WishlistItem) => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', item);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">{wishlistItems.length} items saved</p>
        </div>
        
        {wishlistItems.length > 0 && (
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Add All to Cart
          </button>
        )}
      </div>

      {/* Wishlist Items */}
      {wishlistItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FontAwesomeIcon icon={faHeart} className="text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6">
            Save items you love by clicking the heart icon on any product
          </p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-200 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faHeart} className="text-purple-300 text-4xl" />
                </div>
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                  <button className="p-2 bg-white rounded-full text-gray-700 hover:text-purple-600 transition-colors">
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Status */}
                {!item.inStock && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                      Out of Stock
                    </span>
                  </div>
                )}

                {/* Sale Badge */}
                {item.originalPrice && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                      Sale
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-purple-600">{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">{item.originalPrice}</span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4">Added on {item.dateAdded}</p>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => addToCart(item)}
                    disabled={!item.inStock}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                      item.inStock
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FontAwesomeIcon icon={faShoppingCart} className="w-4 h-4" />
                    <span>{item.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </button>

                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist Stats */}
      {wishlistItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{wishlistItems.length}</p>
              <p className="text-gray-600">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {wishlistItems.filter(item => item.inStock).length}
              </p>
              <p className="text-gray-600">In Stock</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${wishlistItems.reduce((total, item) => {
                  const price = parseFloat(item.price.replace('$', ''));
                  return total + price;
                }, 0).toFixed(2)}
              </p>
              <p className="text-gray-600">Total Value</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}