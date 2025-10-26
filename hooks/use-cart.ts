import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { CartItem } from '@/lib/mock-data-types';
import { getCartFromLocalStorage, clearLocalStorageCart } from '@/lib/cart-utils';

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
    const auth = getAuth();
    let unsubscribeCart: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      // Clean up any previous cart listener when auth state changes
      if (!user && unsubscribeCart) {
        unsubscribeCart();
        unsubscribeCart = null;
      }

      if (user) {
        setCurrentUserId(user.uid);

        // Check cache first
        const cached = cartCache.get(user.uid);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setCartItems(cached.data);
          updateCartCount(cached.data);
          setLoading(false);
        }

        // Sync localStorage cart with Firestore if user just logged in
        if (typeof window !== 'undefined') {
          const localCart = getCartFromLocalStorage();
          if (localCart.length > 0) {
            try {
              const cartRef = doc(db, 'cart', user.uid);
              const cartSnap = await getDoc(cartRef);
              const currentCart = cartSnap.exists() ? cartSnap.data() : {};
              
              // Merge local cart with Firestore cart
              const mergedCart = { ...currentCart };
              localCart.forEach(item => {
                const existingItem = mergedCart[item.id];
                if (existingItem && typeof existingItem === 'object' && 'quantity' in existingItem) {
                  mergedCart[item.id] = {
                    ...item,
                    quantity: (existingItem.quantity || 1) + (item.quantity || 1)
                  };
                } else {
                  mergedCart[item.id] = item;
                }
              });
              
              await setDoc(cartRef, {
                ...mergedCart,
                lastUpdated: new Date().toISOString()
              });
              
              // Clear localStorage after successful sync
              clearLocalStorageCart();
            } catch (error) {
              console.error('useCart: Error syncing local cart with Firestore:', error);
            }
          }
        }

        // Set up real-time listener with error handling
        try {
          const cartRef = doc(db, 'cart', user.uid);

          unsubscribeCart = onSnapshot(
            cartRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const cartData = snapshot.data();
                const items = Object.values(cartData).filter(
                  (item) => typeof item === 'object' && item !== null && 'id' in item
                ) as CartItem[];
                cartCache.set(user.uid, { data: items, timestamp: Date.now() });
                setCartItems(items);
                updateCartCount(items);
              } else {
                setCartItems([]);
                updateCartCount([]);
                cartCache.delete(user.uid);
              }
              setLoading(false);
            },
            (error) => {
              console.error('useCart: Error in cart snapshot:', error);
              // If permission denied, fall back to localStorage
              if (error.code === 'permission-denied') {
                const localItems = getCartFromLocalStorage();
                setCartItems(localItems);
                updateCartCount(localItems);
              } else {
                setCartItems([]);
                updateCartCount([]);
              }
              setLoading(false);
            }
          );
        } catch (error) {
          console.error('useCart: Error setting up cart listener:', error);
          // Fall back to localStorage if there's any error
          const localItems = getCartFromLocalStorage();
          setCartItems(localItems);
          updateCartCount(localItems);
          setLoading(false);
        }
      } else {
        setCurrentUserId(null);
        if (typeof window !== 'undefined') {
          const items = getCartFromLocalStorage();
          setCartItems(items);
          updateCartCount(items);
        }
        setLoading(false);
      }
    });

    return () => {
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
        const items = getCartFromLocalStorage();
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


  return { cartItems, cartCount, currentUserId, loading };
} 