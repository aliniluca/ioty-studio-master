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

        // Sync localStorage cart with Firestore if user just logged in
        if (typeof window !== 'undefined') {
          const localCart = getCartFromLocalStorage();
          if (localCart.length > 0) {
            console.log('useCart: Found local cart items, syncing with Firestore');
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
                lastUpdated: new Date()
              });
              
              // Clear localStorage after successful sync
              clearLocalStorageCart();
              console.log('useCart: Successfully synced local cart with Firestore');
            } catch (error) {
              console.error('useCart: Error syncing local cart with Firestore:', error);
            }
          }
        }

        // Set up real-time listener with error handling
        try {
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
            (error) => {
              console.error('useCart: Error in cart snapshot:', error);
              // If permission denied, fall back to localStorage
              if (error.code === 'permission-denied') {
                console.log('useCart: Permission denied, falling back to localStorage');
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
        console.log('useCart: No user, setting up localStorage');
        setCurrentUserId(null);
        if (typeof window !== 'undefined') {
          const items = getCartFromLocalStorage();
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

  console.log('useCart: Current state - userId:', currentUserId, 'loading:', loading, 'items:', cartItems.length, 'count:', cartCount);

  return { cartItems, cartCount, currentUserId, loading };
} 