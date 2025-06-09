// src/app/shop/[shopId]/page.tsx
"use client"; 
import { useState, useEffect } from 'react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Store, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { StarRating } from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/shared/ListingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Review as ReviewType, ShopDetails, Listing } from '@/lib/mock-data-types'; 
import { MessageSellerDialog } from '@/components/shared/MessageSellerDialog';

export default function ShopPage({ params }: { params: { shopId: string } }) {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [shopListings, setShopListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.shopId) {
      // Refactor shop details and listings to use Firestore only.
    }
    setIsLoading(false);
  }, [params.shopId]);

  if (isLoading) {
    return <div className="text-center py-10"><p className="text-muted-foreground">Se caută atelierul prin tărâmul ioty...</p></div>;
  }

  if (!shop) {
    return <PlaceholderContent 
                title="Atelier de negăsit" 
                description="Acest atelier s-a pierdut prin ceața tărâmului fermecat sau poate meșterul făurar încă nu i-a deschis porțile. Caută alte minunății!" 
                icon={Store} />;
  }

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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{shop.name}</h1>
          <p className="text-muted-foreground mt-1">{shop.tagline}</p>
          <div className="mt-2 flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
            <StarRating rating={shop.shopRating} reviewCount={shop.shopReviewCount} />
            <span>•</span>
            <span>{shop.location}</span>
            <span>•</span>
            <span>În breaslă din {shop.memberSince}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Button variant="outline">Adaugă atelierul la favorite</Button>
          <Button variant="default" onClick={() => setIsMessageDialogOpen(true)}>Trimite un mesaj meșterului</Button>
        </div>
      </div>

      <MessageSellerDialog 
        isOpen={isMessageDialogOpen} 
        onOpenChange={setIsMessageDialogOpen} 
        sellerName={shop.name} 
      />

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="listings">Minunății ({shopListings.filter(l => l.status === 'approved' || l.status === 'pending_approval').length})</TabsTrigger>
          <TabsTrigger value="about">Povestea atelierului</TabsTrigger>
          <TabsTrigger value="reviews">Vorbe dulci ({shop.shopReviewCount})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="listings" className="mt-8">
          {shopListings.filter(l => l.status === 'approved' || l.status === 'pending_approval').length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {shopListings.map((listing) => (
                    (listing.status === 'approved' || listing.status === 'pending_approval') &&
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

        <TabsContent value="reviews" className="mt-8 max-w-2xl mx-auto">
           <Card className="bg-card">
            <CardHeader><CardTitle>Ce zic alți exploratori despre atelier ({shop.reviews.length})</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {shop.reviews.length > 0 ? shop.reviews.map((review: ReviewType) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                     {review.user.avatarUrl && (
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={review.user.avatarUrl} alt={review.user.name} data-ai-hint={review.user.dataAiHint || 'utilizator recenzie'} />
                            <AvatarFallback>{review.user.name.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                     )}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-card-foreground">{review.user.name}</h4>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                        <StarRating rating={review.rating} size={16} />
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">Încă nu s-au adunat povești despre acest atelier. Fii primul care lasă o vorbă bună!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
