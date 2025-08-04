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
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        // Listen to cart changes in Firestore (new structure)
        const cartRef = doc(db, 'carts', user.uid);
        const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
          if (snapshot.exists()) {
            const cartData = snapshot.data();
            // Extract cart items from the document
            const items = Object.values(cartData).filter(item => 
              typeof item === 'object' && item !== null && 'id' in item
            ) as CartItem[];
            setCartItems(items);
            setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
          } else {
            setCartItems([]);
            setCartCount(0);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error listening to cart:', error);
          setCartItems([]);
          setCartCount(0);
          setLoading(false);
        });
        return () => unsubscribeCart();
      } else {
        setCurrentUserId(null);
        // Load cart from localStorage
        if (typeof window !== 'undefined') {
          const items = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
          setCartItems(items);
          setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return { cartItems, cartCount, currentUserId, loading };
} 