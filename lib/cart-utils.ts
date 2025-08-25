import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CartItem } from './mock-data-types';

// Cache for cart data to reduce Firebase calls
const cartCache = new Map<string, { data: CartItem[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function addToCartFirestore(userId: string, item: CartItem): Promise<boolean> {
  console.log('addToCartFirestore called with:', { userId, item });
  
  if (!userId || !item || !item.id) {
    throw new Error('Invalid parameters for addToCartFirestore');
  }
  
  try {
    const cartRef = doc(db, 'cart', userId);
    console.log('Cart reference created:', cartRef.path);
    
    const docSnap = await getDoc(cartRef);
    console.log('Current cart exists:', docSnap.exists());
    const currentCart = docSnap.exists() ? docSnap.data() : {};
    console.log('Current cart data:', currentCart);
    
    // Filter out undefined values from the item before saving
    const cleanItem = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    );
    
    // If item already exists, update quantity
    const existingItem = currentCart[item.id];
    if (existingItem && typeof existingItem === 'object' && 'quantity' in existingItem) {
      cleanItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
    }
    
    const updatedCart = {
      ...currentCart,
      [item.id]: cleanItem,
      lastUpdated: new Date()
    };
    console.log('Updated cart data:', updatedCart);
    
    await setDoc(cartRef, updatedCart);
    console.log('Cart successfully updated in Firestore');
    
    // Update cache
    const items = Object.values(updatedCart).filter(
      (item) => typeof item === 'object' && item !== null && 'id' in item
    ) as CartItem[];
    cartCache.set(userId, { data: items, timestamp: Date.now() });
    
    return true;
  } catch (error: any) {
    console.error('Error in addToCartFirestore:', error);
    
    // If permission denied, fall back to localStorage
    if (error.code === 'permission-denied') {
      console.log('Permission denied, falling back to localStorage');
      addToCartLocalStorage(item);
      return false; // Indicate fallback was used
    }
    
    throw error;
  }
}

export async function removeFromCartFirestore(userId: string, productId: string): Promise<boolean> {
  console.log('removeFromCartFirestore called with:', { userId, productId });
  
  if (!userId || !productId) {
    throw new Error('Invalid parameters for removeFromCartFirestore');
  }
  
  try {
    const cartRef = doc(db, 'cart', userId);
    const docSnap = await getDoc(cartRef);
    
    if (docSnap.exists()) {
      const currentCart = docSnap.data();
      const { [productId]: removed, ...updatedCart } = currentCart;
      
      await setDoc(cartRef, {
        ...updatedCart,
        lastUpdated: new Date()
      });
      
      // Update cache
      const items = Object.values(updatedCart).filter(
        (item) => typeof item === 'object' && item !== null && 'id' in item
      ) as CartItem[];
      cartCache.set(userId, { data: items, timestamp: Date.now() });
      
      console.log('Item successfully removed from cart');
      return true;
    }
    
    console.log('Cart document does not exist');
    return false;
  } catch (error) {
    console.error('Error in removeFromCartFirestore:', error);
    throw error;
  }
}

export async function updateCartItemFirestore(userId: string, updatedItem: CartItem): Promise<boolean> {
  console.log('updateCartItemFirestore called with:', { userId, updatedItem });
  
  if (!userId || !updatedItem || !updatedItem.id) {
    throw new Error('Invalid parameters for updateCartItemFirestore');
  }
  
  try {
    const cartRef = doc(db, 'cart', userId);
    const docSnap = await getDoc(cartRef);
    const currentCart = docSnap.exists() ? docSnap.data() : {};
    
    const updatedCart = {
      ...currentCart,
      [updatedItem.id]: updatedItem,
      lastUpdated: new Date()
    };
    
    await setDoc(cartRef, updatedCart);
    console.log('Cart item successfully updated');
    
    // Update cache
    const items = Object.values(updatedCart).filter(
      (item) => typeof item === 'object' && item !== null && 'id' in item
    ) as CartItem[];
    cartCache.set(userId, { data: items, timestamp: Date.now() });
    
    return true;
  } catch (error) {
    console.error('Error in updateCartItemFirestore:', error);
    throw error;
  }
}

export function addToCartLocalStorage(item: CartItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((x: CartItem) => x.id === item.id);
    
    if (idx !== -1) {
      cart[idx].quantity += item.quantity;
    } else {
      cart.push(item);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated'));
    console.log('Item added to localStorage cart');
  } catch (error) {
    console.error('Error adding to localStorage cart:', error);
  }
}

export function removeFromCartLocalStorage(productId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = cart.filter((item: CartItem) => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('cart:updated'));
    console.log('Item removed from localStorage cart');
  } catch (error) {
    console.error('Error removing from localStorage cart:', error);
  }
}

export function updateCartItemLocalStorage(updatedItem: CartItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((item: CartItem) => item.id === updatedItem.id);
    
    if (idx !== -1) {
      cart[idx] = updatedItem;
    } else {
      cart.push(updatedItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated'));
    console.log('Item updated in localStorage cart');
  } catch (error) {
    console.error('Error updating localStorage cart:', error);
  }
}

export function getCartFromLocalStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    console.error('Error getting cart from localStorage:', error);
    return [];
  }
}

export function clearLocalStorageCart(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('cart');
    window.dispatchEvent(new CustomEvent('cart:updated'));
    console.log('LocalStorage cart cleared');
  } catch (error) {
    console.error('Error clearing localStorage cart:', error);
  }
}
