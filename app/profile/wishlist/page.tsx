// src/app/profile/wishlist/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { db, auth } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import { ListingCard } from '@/components/shared/ListingCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

export default function ProfileWishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteShops, setFavoriteShops] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Fetch wishlist items
        const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
        const wishlistSnap = await getDocs(wishlistRef);
        const productIds = wishlistSnap.docs.map(doc => doc.id);
        // Fetch product details for each favorite
        const products = await Promise.all(productIds.map(async (pid) => {
          const prodDoc = await getDoc(doc(db, 'listings', pid));
          return prodDoc.exists() ? { id: prodDoc.id, ...prodDoc.data() } : null;
        }));
        setWishlist(products.filter(Boolean));
        // Fetch favorite shops
        const favShopsRef = collection(db, 'users', user.uid, 'favoriteShops');
        const favShopsSnap = await getDocs(favShopsRef);
        const shopIds = favShopsSnap.docs.map(doc => doc.id);
        const shops = await Promise.all(shopIds.map(async (sid) => {
          const shopDoc = await getDoc(doc(db, 'shops', sid));
          return shopDoc.exists() ? { id: shopDoc.id, ...shopDoc.data() } : null;
        }));
        setFavoriteShops(shops.filter(Boolean));
      } else {
        setUserId(null);
        setWishlist([]);
        setFavoriteShops([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!userId) {
    return <PlaceholderContent title="Nu ești autentificat" description="Te rugăm să te autentifici pentru a vedea lista ta de dorințe." />;
  }

  if (wishlist.length === 0 && favoriteShops.length === 0) {
    return <PlaceholderContent title="Cufărul cu dorințe e gol" description="Nu ai adăugat încă nicio minunăție sau atelier la favorite. Explorează târgul și pune la inimă ce-ți place!" icon={Star} />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Cufărul cu dorințe</h1>
      {favoriteShops.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Ateliere favorite</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favoriteShops.map(shop => (
              <Card key={shop.id} className="flex flex-col items-center p-6">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src={shop.avatarUrl} alt={shop.name} />
                  <AvatarFallback>{shop.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link href={`/shop/${shop.id}`} className="text-lg font-semibold text-primary hover:underline mb-1">{shop.name}</Link>
                <div className="text-sm text-muted-foreground mb-2">{shop.tagline}</div>
                <div className="text-xs text-muted-foreground">{shop.location}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {wishlist.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Minunății favorite</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {wishlist.map(product => (
              <ListingCard key={product.id} listing={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
