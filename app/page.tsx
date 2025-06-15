"use client";
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, HandHeart, Search, PackageOpen, Store as StoreIcon } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navigationCategories } from '@/lib/nav-data'; 
import { ListingCard } from '@/components/shared/ListingCard';
import type { ShopDetails, ProductDetails } from '@/lib/mock-data-types';
import { SearchSection } from '@/components/home/SearchSection';

const categoriesToDisplay = navigationCategories.slice(0, 4).map(cat => ({
  name: cat.label,
  href: cat.href,
  imageUrl: `https://picsum.photos/seed/hp_cat_${cat.slug}/300/200`, 
  imageHint: cat.dataAiHint || cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), 
}));

export default function HomePage() {
  return (
    <div className="space-y-16">
      <Suspense fallback={<div>Loading search...</div>}>
        <SearchSection />
      </Suspense>
      
      {/* Rest of your homepage content */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Descoperă Atelierele Meșterilor Noștri</h1>
          <p className="text-xl text-muted-foreground">Făurituri unice, create cu pasiune și pricepere</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesToDisplay.map((category) => (
            <Link key={category.name} href={category.href} className="group">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative h-48">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-center">{category.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
