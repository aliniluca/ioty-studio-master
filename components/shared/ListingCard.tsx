"use client";
import { memo, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { Heart, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Listing, CartItem } from '@/lib/mock-data-types';
import { Badge } from '../ui/badge';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Heart as HeartIcon, HeartOff } from 'lucide-react';
import { addToCartFirestore, addToCartLocalStorage } from '@/lib/cart-utils';

// Cache for user authentication state
const authCache = new Map<string, { user: any, timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Cart functions are now imported from cart-utils

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard = memo(function ListingCard({ listing }: ListingCardProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Memoized handlers to prevent unnecessary re-renders
  const handleAddToCart = useCallback(async () => {
    if (listing.status !== 'approved') {
      toast({
        variant: "destructive",
        title: "Minunăție neaprobată",
        description: `Această făuritură încă așteaptă binecuvântarea zânelor și nu poate fi adăugată în coș.`,
      });
      return;
    }

    const item = {
      id: listing.id,
      name: listing.name,
      price: listing.price,
      imageUrl: listing.imageUrl,
      quantity: 1,
      seller: listing.seller.name,
      productId: listing.id,
      dataAiHint: listing.dataAiHint,
    };

    if (userId) {
      try {
        console.log('Attempting to add to cart for user:', userId);
        const success = await addToCartFirestore(userId, item);
        if (success) {
          console.log('Successfully added to cart');
          toast({
            title: "În coșuleț a sărit!",
            description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat.`,
          });
        } else {
          console.log('Firestore failed, using localStorage fallback');
          toast({
            title: "În coșuleț a sărit!",
            description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat (mod local).`,
          });
        }
      } catch (e) {
        console.error('Error adding to cart:', e);
        // Fall back to localStorage
        addToCartLocalStorage(item);
        toast({
          title: "În coșuleț a sărit!",
          description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat (mod local).`,
        });
      }
    } else {
      addToCartLocalStorage(item);
      toast({
        title: "În coșuleț a sărit!",
        description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat.`,
      });
    }
  }, [listing, userId, toast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Autentificare necesară",
        description: "Trebuie să fii autentificat pentru a adăuga la favorite.",
      });
      return;
    }
    setLoading(true);
    try {
      const favRef = doc(db, 'users', userId, 'wishlist', listing.id);
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
        toast({
          title: "Eliminată din favorite!",
          description: `Comoara \"${listing.name}\" a fost scoasă din lista ta de dorințe.`,
        });
      } else {
        await setDoc(favRef, { addedAt: new Date() });
        setIsFavorite(true);
        toast({
          title: "Pusă la inimă!",
          description: `Comoara \"${listing.name}\" e acum în lista ta de dorințe strălucitoare.`,
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Eroare la favorite",
        description: "A apărut o problemă la actualizarea favoritei. Încearcă din nou!",
      });
    }
    setLoading(false);
  }, [listing.id, listing.name, userId, isFavorite, toast]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  useEffect(() => {
    // Check cache first
    const cached = authCache.get('current');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setUserId(cached.user?.uid || null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Cache the user
        authCache.set('current', { user, timestamp: Date.now() });
        
        // Check if this product is in the user's wishlist
        const favDoc = await getDoc(doc(db, 'users', user.uid, 'wishlist', listing.id));
        setIsFavorite(favDoc.exists());
      } else {
        setUserId(null);
        setIsFavorite(false);
        authCache.delete('current');
      }
    });
    return () => unsubscribe();
  }, [listing.id]);

  return (
    <Card className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-md hover:shadow-xl transition-all duration-300 h-full">
      <Link href={`/products/${listing.id}`} className="block overflow-hidden relative">
        {listing.status === 'pending_approval' && (
          <Badge variant="secondary" className="absolute top-2 left-2 z-10 bg-yellow-400/80 text-yellow-900 border-yellow-500/50 backdrop-blur-sm">
            <AlertTriangle className="h-3 w-3 mr-1" />
            În așteptare
          </Badge>
        )}
        <div className="relative w-full aspect-[4/3]">
          <Image
            src={listing.imageUrl}
            alt={listing.name}
            layout="fill"
            objectFit="cover"
            className={`transition-transform duration-500 ease-in-out group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            data-ai-hint={listing.dataAiHint || 'articol lucrat manual'}
            onLoad={handleImageLoad}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </Link>
      <CardHeader className="p-4">
        <Link href={`/products/${listing.id}`} className="block">
          <CardTitle className="text-lg font-semibold leading-tight hover:text-primary transition-colors truncate" title={listing.name}>
            {listing.name}
          </CardTitle>
        </Link>
        <Link href={`/shop/${listing.seller.id}`} className="text-xs text-muted-foreground hover:underline truncate" title={`Făurit de ${listing.seller.name}`}>
          Făurit de {listing.seller.name}
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-center justify-between mb-2">
          <StarRating rating={listing.rating} reviewCount={listing.reviewCount} size={16} />
        </div>
        <p className="text-xl font-bold text-foreground"> 
          {listing.price.toFixed(2)} RON
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center gap-2 border-t mt-auto">
        <Button 
          size="sm" 
          className="flex-grow bg-primary hover:bg-primary/80 text-primary-foreground transition-colors"
          onClick={handleAddToCart}
          aria-label={`Adaugă în coș ${listing.name}`}
          disabled={listing.status !== 'approved'}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> În coșuleț
        </Button>
        <Button 
          variant={isFavorite ? "default" : "outline"} 
          size="icon" 
          className={`shrink-0 transition-colors ${isFavorite ? 'text-destructive bg-destructive/10 border-destructive/50' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border hover:border-destructive/50'}`}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? `Elimină din favorite ${listing.name}` : `Pune la inimă ${listing.name}`}
          disabled={loading}
        >
          {isFavorite ? <HeartIcon fill="currentColor" className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
          <span className="sr-only">{isFavorite ? 'Elimină din favorite' : 'Pune la inimă'}</span>
        </Button>
      </CardFooter>
    </Card>
  );
});
