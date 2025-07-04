// src/app/shop/[shopId]/page.tsx
"use client"; 
import { useState, useEffect } from 'react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Store, AlertTriangle, Heart as HeartIcon, Star } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ShopPage({ params }: { params: { shopId: string } }) {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [shopListings, setShopListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    async function fetchShopAndListings() {
      setIsLoading(true);
      // Extract the user ID from the shopId (shop_<userId>...)
      let realShopId = params.shopId;
      if (params.shopId.startsWith('shop_')) {
        const parts = params.shopId.substring(5).split('_');
        realShopId = parts[0];
      }
      console.log('Fetching shop with ID:', params.shopId);
      console.log('User ID used as shop document ID:', realShopId);
      try {
        // Fetch shop details using the user ID
        const shopRef = doc(db, 'shops', realShopId);
        const shopSnap = await getDoc(shopRef);
        console.log('Shop exists:', shopSnap.exists());
        if (shopSnap.exists()) {
          const shopData = { id: shopSnap.id, ...shopSnap.data() } as ShopDetails;
          console.log('Shop data:', shopData);
          setShop(shopData);
          // Fetch listings for this shop using the user ID
          const listingsQuery = query(collection(db, 'listings'), where('sellerId', '==', realShopId));
          const listingsSnap = await getDocs(listingsQuery);
          setShopListings(listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Listing[]);
          // Fetch reviews for this shop using the user ID
          const reviewsQuery = query(collection(db, 'shops', realShopId, 'reviews'), orderBy('createdAt', 'desc'));
          const reviewsSnap = await getDocs(reviewsQuery);
          const reviews = reviewsSnap.docs.map(doc => doc.data());
          setShopReviews(reviews);
          if (reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
            setAverageRating(avg);
          } else {
            setAverageRating(null);
          }
        } else {
          console.log('Shop not found in database');
          setShop(null);
          setShopListings([]);
          setShopReviews([]);
          setAverageRating(null);
        }
      } catch (e) {
        console.error('Error fetching shop:', e);
        setShop(null);
        setShopListings([]);
        setShopReviews([]);
        setAverageRating(null);
      }
      setIsLoading(false);
    }
    if (params.shopId) {
      fetchShopAndListings();
    }
  }, [params.shopId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Extract the user ID from the shopId
        let realShopId = params.shopId;
        if (params.shopId.startsWith('shop_')) {
          const parts = params.shopId.substring(5).split('_');
          realShopId = parts[0];
        }
        // Check if this shop is in the user's favoriteShops
        const favDoc = await getDoc(doc(db, 'users', user.uid, 'favoriteShops', realShopId));
        setIsFavorite(favDoc.exists());
      } else {
        setUserId(null);
        setIsFavorite(false);
      }
    });
    return () => unsubscribe();
  }, [params.shopId]);

  const handleToggleFavoriteShop = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Autentificare necesară",
        description: "Trebuie să fii autentificat pentru a adăuga la favorite.",
      });
      return;
    }
    setFavLoading(true);
    try {
      // Extract the user ID from the shopId
      let realShopId = params.shopId;
      if (params.shopId.startsWith('shop_')) {
        const parts = params.shopId.substring(5).split('_');
        realShopId = parts[0];
      }
      const favRef = doc(db, 'users', userId, 'favoriteShops', realShopId);
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
        toast({
          title: "Atelier eliminat din favorite!",
          description: `Atelierul "${shop?.name}" a fost scos din lista ta de ateliere favorite.`,
        });
      } else {
        await setDoc(favRef, { addedAt: new Date() });
        setIsFavorite(true);
        toast({
          title: "Atelier pus la inimă!",
          description: `Atelierul "${shop?.name}" e acum în lista ta de ateliere favorite.`,
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Eroare la favorite",
        description: "A apărut o problemă la actualizarea favoritei. Încearcă din nou!",
      });
    }
    setFavLoading(false);
  };

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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{shop.name}</h1>
            {averageRating !== null && (
              <span className="flex items-center gap-1 text-yellow-500 font-semibold text-lg">
                {averageRating.toFixed(1)}
                <Star className="h-5 w-5" />
                <span className="text-muted-foreground text-sm">({shopReviews.length} recenzii)</span>
              </span>
            )}
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
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Button
            variant={isFavorite ? "default" : "outline"}
            className={`flex items-center gap-2 ${isFavorite ? 'text-destructive bg-destructive/10 border-destructive/50' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border hover:border-destructive/50'}`}
            onClick={handleToggleFavoriteShop}
            disabled={favLoading}
            aria-label={isFavorite ? `Elimină atelierul din favorite` : `Adaugă atelierul la favorite`}
          >
            <HeartIcon className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
            {isFavorite ? 'În favorite' : 'Adaugă atelierul la favorite'}
          </Button>
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

      {/* Shop Reviews Section */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Recenzii atelier</h2>
        {shopReviews.length === 0 ? (
          <div className="text-muted-foreground">Acest atelier nu are încă recenzii.</div>
        ) : (
          <div className="space-y-6">
            {shopReviews.map((review, idx) => (
              <div key={review.id || idx} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= review.rating ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-1">{review.userEmail}</div>
                <div>{review.comment}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shop Policies & FAQ Section */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Politici și Întrebări frecvente</h2>
        {shop.policies ? (
          <div className="mb-6">
            <h3 className="font-semibold mb-1">Politici ale atelierului</h3>
            <div className="whitespace-pre-line text-muted-foreground">{shop.policies}</div>
          </div>
        ) : null}
        {shop.faq ? (
          <div>
            <h3 className="font-semibold mb-1">Întrebări frecvente (FAQ)</h3>
            <div className="whitespace-pre-line text-muted-foreground">{shop.faq}</div>
          </div>
        ) : null}
        {!shop.policies && !shop.faq && (
          <div className="text-muted-foreground">Acest atelier nu a adăugat încă politici sau întrebări frecvente.</div>
        )}
      </section>
    </div>
  );
}
