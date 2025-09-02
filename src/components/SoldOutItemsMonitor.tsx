'use client';
import { useEffect, useRef } from 'react';
import { useGemPouch } from '@/contexts/GemPouchContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function SoldOutItemsMonitor() {
  const { items: cartItems, removeSoldOutItems: removeCartSoldOut } = useGemPouch();
  const { items: wishlistItems } = useWishlist(); // Note: We DON'T remove sold out items from wishlist
  const { showNotification } = useNotification();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const checkSoldOutItems = async () => {
      // Don't check too frequently (every 30 seconds max)
      const now = Date.now();
      if (now - lastCheckRef.current < 30000) {
        return;
      }
      lastCheckRef.current = now;

      try {
        // Get all unique item IDs from cart and wishlist
        const allItemIds = [...new Set([
          ...cartItems.map(item => item.id),
          ...wishlistItems.map(item => item.id)
        ])];

        if (allItemIds.length === 0) {
          return; // No items to check
        }

        // Fetch current product data
        const response = await fetch('/api/products');
        if (!response.ok) return;

        const { products } = await response.json();
        if (!products) return;

        // Create a map of product ID to inventory
        const inventoryMap = new Map(
          products.map((product: any) => [product.id, product.inventory || 0])
        );

        // Check for sold out items in cart
        const soldOutCartItems = cartItems.filter(item => {
          const currentInventory = inventoryMap.get(item.id);
          return currentInventory !== undefined && currentInventory === 0;
        });

        // Check for sold out items in wishlist
        const soldOutWishlistItems = wishlistItems.filter(item => {
          const currentInventory = inventoryMap.get(item.id);
          return currentInventory !== undefined && currentInventory === 0;
        });

        // Remove sold out items from cart
        if (soldOutCartItems.length > 0) {
          removeCartSoldOut();
          showNotification('info', `Removed ${soldOutCartItems.length} sold out item${soldOutCartItems.length > 1 ? 's' : ''} from your cart`);
        }

        // Note: We DON'T remove sold out items from wishlist - they stay with SOLD overlay
        // This allows users to keep them and purchase later if restocked

      } catch (error) {
        // Silently fail - don't spam the user with error notifications
        console.warn('Failed to check for sold out items:', error);
      }
    };

    // Check immediately if we have items
    if (cartItems.length > 0 || wishlistItems.length > 0) {
      checkSoldOutItems();
    }

    // Set up interval to check periodically
    const interval = setInterval(checkSoldOutItems, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [cartItems.length, wishlistItems.length, removeCartSoldOut, showNotification]);

  // This component doesn't render anything
  return null;
}