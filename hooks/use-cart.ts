import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { CartItem } from '@/lib/mock-data-types';

// Cache for cart data to reduce Firebase calls
const cartCache = new Map<string, { data: CartItem[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoized cart count calculation
  const memoizedCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Debounced function to update cart count
  const updateCartCount = useCallback((items: CartItem[]) => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  }, []);

  useEffect(() => {
    console.log('useCart: Starting effect');
    const auth = getAuth();
    let unsubscribeCart: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('useCart: Auth state changed, user:', user ? user.uid : 'null');

      // Clean up any previous cart listener when auth state changes
      if (!user && unsubscribeCart) {
        console.log('useCart: Cleaning up previous cart listener');
        unsubscribeCart();
        unsubscribeCart = null;
      }

      if (user) {
        setCurrentUserId(user.uid);
        console.log('useCart: User authenticated, setting up cart listener for:', user.uid);

        // Check cache first
        const cached = cartCache.get(user.uid);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('useCart: Using cached cart data');
          setCartItems(cached.data);
          updateCartCount(cached.data);
          setLoading(false);
        }

        // Set up real-time listener
        const cartRef = doc(db, 'cart', user.uid);
        console.log('useCart: Cart reference created:', cartRef.path);

        unsubscribeCart = onSnapshot(
          cartRef,
          (snapshot) => {
            console.log('useCart: Cart snapshot received:', snapshot.exists());
            if (snapshot.exists()) {
              const cartData = snapshot.data();
              console.log('useCart: Cart data from snapshot:', cartData);
              const items = Object.values(cartData).filter(
                (item) => typeof item === 'object' && item !== null && 'id' in item
              ) as CartItem[];
              console.log('useCart: Extracted cart items:', items);
              cartCache.set(user.uid, { data: items, timestamp: Date.now() });
              setCartItems(items);
              updateCartCount(items);
            } else {
              console.log('useCart: Cart document does not exist');
              setCartItems([]);
              updateCartCount([]);
              cartCache.delete(user.uid);
            }
            setLoading(false);
          },
          () => {
            setCartItems([]);
            updateCartCount([]);
            setLoading(false);
          }
        );
      } else {
        console.log('useCart: No user, setting up localStorage');
        setCurrentUserId(null);
        if (typeof window !== 'undefined') {
          const items = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
          console.log('useCart: Loaded items from localStorage:', items);
          setCartItems(items);
          updateCartCount(items);
        }
        setLoading(false);
      }
    });

    return () => {
      console.log('useCart: Cleaning up auth listener');
      if (unsubscribeCart) {
        unsubscribeCart();
        unsubscribeCart = null;
      }
      unsubscribe();
    };
  }, [updateCartCount]);

  // Listen for local cart updates while logged out
  useEffect(() => {
    function handleLocalCartUpdated() {
      if (!currentUserId && typeof window !== 'undefined') {
        const items = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
        setCartItems(items);
        updateCartCount(items);
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('cart:updated', handleLocalCartUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cart:updated', handleLocalCartUpdated);
      }
    };
  }, [currentUserId, updateCartCount]);

  // Update cart count when cartItems change
  useEffect(() => {
    setCartCount(memoizedCartCount);
  }, [memoizedCartCount]);

  console.log('useCart: Current state - userId:', currentUserId, 'loading:', loading, 'items:', cartItems.length, 'count:', cartCount);

  return { cartItems, cartCount, currentUserId, loading };
} 