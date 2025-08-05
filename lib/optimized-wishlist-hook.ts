import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';

// Cache for wishlist data
const wishlistCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOptimizedWishlist() {
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [favoriteShops, setFavoriteShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlistData = useCallback(async (uid: string) => {
    // Check cache first
    const cacheKey = `wishlist-${uid}`;
    const cached = wishlistCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached wishlist data');
      setWishlist(cached.data.filter(item => item.type === 'product'));
      setFavoriteShops(cached.data.filter(item => item.type === 'shop'));
      setLoading(false);
      return;
    }

    try {
      // Fetch wishlist items
      const wishlistRef = collection(db, 'users', uid, 'wishlist');
      const wishlistSnap = await getDocs(wishlistRef);
      const productIds = wishlistSnap.docs.map(doc => doc.id);
      
      // Fetch product details for each favorite (with error handling)
      const products = await Promise.all(
        productIds.map(async (pid) => {
          try {
            const prodDoc = await getDoc(doc(db, 'listings', pid));
            return prodDoc.exists() ? { id: prodDoc.id, ...prodDoc.data(), type: 'product' } : null;
          } catch (error) {
            console.warn(`Failed to fetch product ${pid}:`, error);
            return null;
          }
        })
      );

      // Fetch favorite shops
      const favShopsRef = collection(db, 'users', uid, 'favoriteShops');
      const favShopsSnap = await getDocs(favShopsRef);
      const shopIds = favShopsSnap.docs.map(doc => doc.id);
      
      const shops = await Promise.all(
        shopIds.map(async (sid) => {
          try {
            const shopDoc = await getDoc(doc(db, 'shops', sid));
            return shopDoc.exists() ? { id: shopDoc.id, ...shopDoc.data(), type: 'shop' } : null;
          } catch (error) {
            console.warn(`Failed to fetch shop ${sid}:`, error);
            return null;
          }
        })
      );

      const allData = [...products.filter(Boolean), ...shops.filter(Boolean)];
      
      // Cache the results
      wishlistCache.set(cacheKey, { data: allData, timestamp: Date.now() });
      
      setWishlist(products.filter(Boolean));
      setFavoriteShops(shops.filter(Boolean));
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
      setWishlist([]);
      setFavoriteShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchWishlistData(user.uid);
        
        // Set up real-time listeners for wishlist changes
        const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
        const favShopsRef = collection(db, 'users', user.uid, 'favoriteShops');
        
        const unsubscribeWishlist = onSnapshot(wishlistRef, async () => {
          // Refresh wishlist data when changes occur
          await fetchWishlistData(user.uid);
        }, (error) => {
          console.error('Wishlist listener error:', error);
        });
        
        const unsubscribeFavShops = onSnapshot(favShopsRef, async () => {
          // Refresh favorite shops data when changes occur
          await fetchWishlistData(user.uid);
        }, (error) => {
          console.error('Favorite shops listener error:', error);
        });
        
        return () => {
          unsubscribeWishlist();
          unsubscribeFavShops();
        };
      } else {
        setUserId(null);
        setWishlist([]);
        setFavoriteShops([]);
        setLoading(false);
        // Clear cache when user logs out
        wishlistCache.clear();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchWishlistData]);

  return { userId, wishlist, favoriteShops, loading };
} 