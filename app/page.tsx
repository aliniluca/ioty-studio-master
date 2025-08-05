"use client";
import { Suspense, lazy } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, HandHeart, Search, PackageOpen, Store as StoreIcon } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navigationCategories } from '@/lib/nav-data'; 
import type { ShopDetails, ProductDetails } from '@/lib/mock-data-types';

// Lazy load heavy components
const SearchSection = lazy(() => import('@/components/home/SearchSection').then(module => ({ default: module.SearchSection })));
const ListingCard = lazy(() => import('@/components/shared/ListingCard').then(module => ({ default: module.ListingCard })));

// Skeleton components for loading states
const SearchSkeleton = () => (
  <div className="max-w-4xl mx-auto mb-8">
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
      </div>
    ))}
  </div>
);

const categoriesToDisplay = navigationCategories.slice(0, 4).map(cat => ({
  name: cat.label,
  href: cat.href,
  imageUrl: `https://picsum.photos/seed/hp_cat_${cat.slug}/300/200`, 
  imageHint: cat.dataAiHint || cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), 
}));

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 -mt-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Descoperă Atelierele Meșterilor Noștri
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Făurituri unice, create cu pasiune și pricepere
          </p>
          
          <Suspense fallback={<SearchSkeleton />}>
            <SearchSection />
          </Suspense>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Explorează Categoriile</h2>
          <p className="text-lg text-muted-foreground">Găsește minunățiile perfecte pentru tine</p>
        </div>

        <Suspense fallback={<CategorySkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriesToDisplay.map((category) => (
              <Link key={category.name} href={category.href} className="group">
                <Card className="overflow-hidden transition-all hover:shadow-lg h-full">
                  <div className="relative h-48">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      priority={false}
                      loading="lazy"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-center">{category.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </Suspense>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-lg">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">De ce ioty.ro?</h2>
          <p className="text-lg text-muted-foreground">Descoperă avantajele platformei noastre</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Creații Unice</h3>
            <p className="text-muted-foreground">
              Fiecare produs este creat manual cu atenție la detalii și pasiune pentru meșteșug.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandHeart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Suport Meșteri</h3>
            <p className="text-muted-foreground">
              Susținem artizanii locali și promovăm tradițiile meșteșugărești românești.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Livrare Sigură</h3>
            <p className="text-muted-foreground">
              Livrare rapidă și sigură în toată România, cu protecție completă a produselor.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 text-center">
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vrei să vinzi pe ioty.ro?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Alătură-te comunității noastre de meșteri și începe să vinzi creațiile tale unice.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sell" className="text-lg px-8 py-3">
              <StoreIcon className="mr-2 h-5 w-5" />
              Începe să vinzi
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
