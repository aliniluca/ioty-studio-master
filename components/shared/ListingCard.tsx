"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { Heart, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Listing, CartItem } from '@/lib/mock-data-types';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Heart as HeartIcon, HeartOff } from 'lucide-react';

// Add cart functions
function addToCartLocalStorage(item: CartItem) {
  if (typeof window === 'undefined') return;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  // If already in cart, increase quantity
  const idx = cart.findIndex((x: CartItem) => x.id === item.id);
  if (idx !== -1) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCartFirestore(userId: string, item: CartItem) {
  console.log('addToCartFirestore called with:', { userId, item });
  
  if (!userId || !item || !item.id) {
    throw new Error('Invalid parameters for addToCartFirestore');
  }
  
  try {
    // Use a single cart document instead of subcollections
    const cartRef = doc(db, 'cart', userId);
    console.log('Cart reference created:', cartRef.path);
    
    // Get current cart and update it
    return getDoc(cartRef).then((docSnap) => {
      console.log('Current cart exists:', docSnap.exists());
      const currentCart = docSnap.exists() ? docSnap.data() : {};
      console.log('Current cart data:', currentCart);
      
      // Filter out undefined values from the item before saving
      const cleanItem = Object.fromEntries(
        Object.entries(item).filter(([_, value]) => value !== undefined)
      );
      
      const updatedCart = {
        ...currentCart,
        [item.id]: cleanItem,
        lastUpdated: new Date()
      };
      console.log('Updated cart data:', updatedCart);
      
      return setDoc(cartRef, updatedCart).then(() => {
        console.log('Cart successfully updated in Firestore');
        return true;
      }).catch((error) => {
        console.error('Error in setDoc:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        throw error;
      });
    }).catch((error) => {
      console.error('Error in getDoc:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    });
  } catch (error) {
    console.error('Error in addToCartFirestore:', error);
    throw error;
  }
}

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Check if this product is in the user's wishlist
        const favDoc = await getDoc(doc(db, 'users', user.uid, 'wishlist', listing.id));
        setIsFavorite(favDoc.exists());
      } else {
        setUserId(null);
        setIsFavorite(false);
      }
    });
    return () => unsubscribe();
  }, [listing.id]);

  const handleAddToCart = async () => {
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
        await addToCartFirestore(userId, item);
        console.log('Successfully added to cart');
        toast({
          title: "În coșuleț a sărit!",
          description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat.`,
        });
      } catch (e) {
        console.error('Error in handleAddToCart:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error('Error details:', {
          code: e instanceof Error && 'code' in e ? e.code : 'unknown',
          message: errorMessage,
          stack: e instanceof Error ? e.stack : 'No stack trace'
        });
        toast({
          variant: "destructive",
          title: "Eroare la adăugare în coș!",
          description: `Nu am putut adăuga minunăția în coșuleț: ${errorMessage}`,
        });
      }
    } else {
      addToCartLocalStorage(item);
      toast({
        title: "În coșuleț a sărit!",
        description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat.`,
      });
    }
  };

  const handleToggleFavorite = async () => {
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
  };

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
            className="transition-transform duration-500 ease-in-out group-hover:scale-110"
            data-ai-hint={listing.dataAiHint || 'articol lucrat manual'}
          />
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
}
