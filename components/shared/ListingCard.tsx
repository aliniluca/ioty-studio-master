
"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { Heart, ShoppingCart, AlertTriangle } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import type { Listing } from '@/lib/mock-data-types'; 
import { Badge } from '../ui/badge';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (listing.status !== 'approved') {
      toast({
        variant: "destructive",
        title: "Minunăție neaprobată",
        description: `Această făuritură încă așteaptă binecuvântarea zânelor și nu poate fi adăugată în coș.`,
      });
      return;
    }
    console.log(`Minunăția ${listing.name} a sărit în coșuleț (ID: ${listing.id})`);
    toast({
      title: "În coșuleț a sărit!",
      description: `Minunăția "${listing.name}" e acum în coșulețul tău fermecat. (Simulare)`,
    });
  };

  const handleAddToFavorites = () => {
    console.log(`Minunăția ${listing.name} a fost pusă la inimă (ID: ${listing.id})`);
    toast({
      title: "Pusă la inimă!",
      description: `Comoara "${listing.name}" e acum în lista ta de dorințe strălucitoare. (Simulare)`,
    });
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
          variant="outline" 
          size="icon" 
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border hover:border-destructive/50 shrink-0 transition-colors"
          onClick={handleAddToFavorites}
          aria-label={`Pune la inimă ${listing.name}`}
        >
          <Heart className="h-5 w-5" />
          <span className="sr-only">Pune la inimă</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
