// src/app/shop/[shopId]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/shared/StarRating';
import { ListingCard } from '@/components/shared/ListingCard';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Store, PackageSearch, AlertTriangle, Heart, ShoppingCart, Star, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { ShopDetails, ProductDetails, Listing } from '@/lib/mock-data-types';
import { productDetailsToListing } from '@/lib/mock-data-types';

interface PageProps {
  params: { shopId: string };
}

export default function ShopPage({ params }: PageProps) {
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShopData() {
      try {
        setLoading(true);
        setError(null);

        // Handle shop ID parsing
        let realShopId = params.shopId;
        if (params.shopId.startsWith('shop_')) {
          const parts = params.shopId.substring(5).split('_');
          realShopId = parts[0];
        }

        console.log('Fetching shop with ID:', params.shopId);

        // Fetch shop details
        const shopRef = doc(db, 'shops', realShopId);
        const shopSnap = await getDoc(shopRef);

        if (!shopSnap.exists()) {
          setError('Magazinul nu a fost găsit');
          setLoading(false);
          return;
        }

        const shopData = { id: shopSnap.id, ...shopSnap.data() } as ShopDetails;
        setShop(shopData);

        // Fetch shop products
        const productsQuery = query(
          collection(db, 'listings'),
          where('sellerId', '==', realShopId),
          where('status', '==', 'approved'),
          orderBy('dateAdded', 'desc'),
          limit(20)
        );

        const productsSnap = await getDocs(productsQuery);
        const productsData = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProductDetails[];

        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Eroare la încărcarea datelor magazinului');
      } finally {
        setLoading(false);
      }
    }

    if (params.shopId) {
      fetchShopData();
    }
  }, [params.shopId]);

  if (loading) {
    return <div className="text-center py-10"><p className="text-muted-foreground">Se caută atelierul prin tărâmul ioty...</p></div>;
  }

  if (error) {
    return (
      <PlaceholderContent
        title="Atelier negăsit"
        description={error}
        icon={AlertTriangle}
      />
    );
  }

  if (!shop) {
    return (
      <PlaceholderContent
        title="Atelier negăsit"
        description="Se pare că acest atelier s-a rătăcit prin târgul fermecat."
        icon={PackageSearch}
      />
    );
  }

  const listings = products.map(product => productDetailsToListing(product));

  return (
    <div className="space-y-8">
      <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden shadow-lg bg-muted">
        <Image src={shop.bannerUrl} alt={`Panoramă din atelierul ${shop.name}`} layout="fill" objectFit="cover" data-ai-hint={shop.dataAiHintBanner || 'banner atelier'} />
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-24 relative z-10 px-4">
        <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
          <AvatarImage src={shop.avatarUrl} alt={shop.name} data-ai-hint={shop.dataAiHintAvatar || 'avatar meșter'} />
          <AvatarFallback className="text-4xl">{shop.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow text-center md:text-left pt-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{shop.name}</h1>
          </div>
          <p className="text-muted-foreground mt-1">{shop.tagline}</p>
          <div className="mt-2 flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
            <StarRating rating={shop.shopRating} reviewCount={shop.shopReviewCount} />
            <span>•</span>
            <span>{shop.location}</span>
            <span>•</span>
            <span>În breaslă din {shop.memberSince}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
          <TabsTrigger value="listings">Minunății ({listings.length})</TabsTrigger>
          <TabsTrigger value="about">Povestea atelierului</TabsTrigger>
        </TabsList>
        
        <TabsContent value="listings" className="mt-8">
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                ))}
            </div>
          ) : (
             <PlaceholderContent 
                title="Atelierul este (încă) liniștit"
                description="Meșterul făurar pregătește noi minunății. Revino curând să vezi ce comori a mai scos la lumină!"
                icon={Store}
            />
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-8 max-w-2xl mx-auto">
          <Card className="bg-card">
            <CardHeader><CardTitle>Povestea atelierului {shop.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{shop.bio}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
