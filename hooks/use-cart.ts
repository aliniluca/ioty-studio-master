import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { CartItem } from '@/lib/mock-data-types';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    console.log('useCart: Starting effect');
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('useCart: Auth state changed, user:', user ? user.uid : 'null');

      if (user) {
        setCurrentUserId(user.uid);
        console.log('useCart: User authenticated, setting up cart listener for:', user.uid);

                       // Listen to cart changes in Firestore (new structure)
               const cartRef = doc(db, 'cart', user.uid);
        console.log('useCart: Cart reference created:', cartRef.path);

        const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
          console.log('useCart: Cart snapshot received:', snapshot.exists());
          if (snapshot.exists()) {
            const cartData = snapshot.data();
            console.log('useCart: Cart data from snapshot:', cartData);
            // Extract cart items from the document
            const items = Object.values(cartData).filter(item =>
              typeof item === 'object' && item !== null && 'id' in item
            ) as CartItem[];
            console.log('useCart: Extracted cart items:', items);
            setCartItems(items);
            setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
          } else {
            console.log('useCart: Cart document does not exist');
            setCartItems([]);
            setCartCount(0);
          }
          setLoading(false);
        }, (error) => {
          console.error('useCart: Error listening to cart:', error);
          setCartItems([]);
          setCartCount(0);
          setLoading(false);
        });

        return () => {
          console.log('useCart: Cleaning up cart listener');
          unsubscribeCart();
        };
      } else {
        console.log('useCart: No user, setting up localStorage');
        setCurrentUserId(null);
        // Load cart from localStorage
        const items = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
        console.log('useCart: Loaded items from localStorage:', items);
        setCartItems(items);
        setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
        setLoading(false);
      }
    });

    return () => {
      console.log('useCart: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  console.log('useCart: Current state - userId:', currentUserId, 'loading:', loading, 'items:', cartItems.length, 'count:', cartCount);

  return { cartItems, cartCount, currentUserId, loading };
} 