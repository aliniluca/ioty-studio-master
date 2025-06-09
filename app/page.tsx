"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, HandHeart, Search, PackageOpen, Store as StoreIcon } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader, CardTitle
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navigationCategories } from '@/lib/nav-data'; 
import { ListingCard } from '@/components/shared/ListingCard';
import type { ShopDetails, ProductDetails } from '@/lib/mock-data-types';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const categoriesToDisplay = navigationCategories.slice(0, 4).map(cat => ({
  name: cat.label,
  href: cat.href,
  imageUrl: `https://picsum.photos/seed/hp_cat_${cat.slug}/300/200`, 
  imageHint: cat.dataAiHint || cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), 
}));

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [productCategory, setProductCategory] = useState('');
  const [minProductPrice, setMinProductPrice] = useState('');
  const [maxProductPrice, setMaxProductPrice] = useState('');
  const [minProductRating, setMinProductRating] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Show advanced search if ?advanced=1 is present
  useEffect(() => {
    if (searchParams.get('advanced') === '1') {
      setShowAdvanced(true);
    } else {
      setShowAdvanced(false);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    // Fetch all shops
    const shopsSnap = await getDocs(collection(db, 'shops'));
    const shops = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Fetch all products
    const productsSnap = await getDocs(collection(db, 'listings'));
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Filter by category, rating, reviews
    const filtered = shops.filter(shop => {
      let ok = true;
      if (category && shop.category !== category) ok = false;
      if (minRating && (!shop.shopRating || shop.shopRating < minRating)) ok = false;
      if (minReviews && (!shop.shopReviewCount || shop.shopReviewCount < minReviews)) ok = false;
      return ok;
    });
    // Compute score for each shop
    const scored = filtered.map(shop => {
      let score = 0;
      const term = search.toLowerCase();
      if (shop.name?.toLowerCase().includes(term)) score += 5;
      if (shop.tagline?.toLowerCase().includes(term)) score += 3;
      if (shop.bio?.toLowerCase().includes(term)) score += 2;
      if (shop.policies?.toLowerCase().includes(term)) score += 1;
      if (shop.faq?.toLowerCase().includes(term)) score += 1;
      if (shop.shopReviewCount) score += Math.min(shop.shopReviewCount, 10);
      if (shop.shopRating) score += shop.shopRating * 2;
      return { ...shop, score };
    });
    const ranked = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    // Product search and ranking
    let productScored = products.map(product => {
      let score = 0;
      const term = search.toLowerCase();
      if (product.name?.toLowerCase().includes(term)) score += 5;
      if (product.description?.toLowerCase().includes(term)) score += 3;
      if (product.category?.toLowerCase().includes(term)) score += 2;
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(term))) score += 1;
      if (product.rating) score += product.rating * 2;
      if (product.reviewCount) score += Math.min(product.reviewCount, 10);
      return { ...product, score };
    });
    // Product filters
    productScored = productScored.filter(product => {
      let ok = true;
      if (productCategory && product.category !== productCategory) ok = false;
      if (minProductPrice && Number(product.price) < Number(minProductPrice)) ok = false;
      if (maxProductPrice && Number(product.price) > Number(maxProductPrice)) ok = false;
      if (minProductRating && (!product.rating || product.rating < minProductRating)) ok = false;
      return ok;
    });
    const productRanked = productScored.filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    setProductResults(productRanked);
    setResults(ranked);
    setSearching(false);
  };

  return (
    <div className="space-y-16">
      {/* Advanced Search Filters (only when showAdvanced) */}
      {showAdvanced && (
        <form onSubmit={handleSearch} className="mb-8 max-w-4xl mx-auto">
          <div className="w-full flex flex-wrap gap-2 mt-4">
            <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded px-2 py-2" aria-label="Categorie atelier">
              <option value="">Toate categoriile</option>
              {navigationCategories.map(cat => (
                <option key={cat.slug} value={cat.label}>{cat.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              placeholder="Rating minim atelier"
              className="w-32 border rounded px-2 py-2"
            />
            <input
              type="number"
              min={0}
              value={minReviews}
              onChange={e => setMinReviews(Number(e.target.value))}
              placeholder="Recenzii minime atelier"
              className="w-32 border rounded px-2 py-2"
            />
            <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="border rounded px-2 py-2" aria-label="Categorie produs">
              <option value="">Toate categoriile produse</option>
              {navigationCategories.map(cat => (
                <option key={cat.slug} value={cat.label}>{cat.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={minProductPrice}
              onChange={e => setMinProductPrice(e.target.value)}
              placeholder="Preț minim"
              className="w-28 border rounded px-2 py-2"
            />
            <input
              type="number"
              min={0}
              value={maxProductPrice}
              onChange={e => setMaxProductPrice(e.target.value)}
              placeholder="Preț maxim"
              className="w-28 border rounded px-2 py-2"
            />
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minProductRating}
              onChange={e => setMinProductRating(Number(e.target.value))}
              placeholder="Rating min. produs"
              className="w-32 border rounded px-2 py-2"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Caută</button>
          </div>
        </form>
      )}
      {/* Search Results */}
      {searching && <div className="mb-8 text-center">Se caută...</div>}
      {!searching && results.length > 0 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Rezultate ateliere</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map(shop => (
              <div key={shop.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">{shop.name}</span>
                  {shop.shopRating && (
                    <span className="flex items-center gap-1 text-yellow-500 font-semibold text-base">
                      {shop.shopRating.toFixed(1)}
                      <Star className="h-4 w-4" />
                      <span className="text-muted-foreground text-xs">({shop.shopReviewCount || 0})</span>
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mb-2">{shop.tagline}</div>
                <div className="mb-2 line-clamp-2">{shop.bio}</div>
                <a href={`/shop/${shop.id}`} className="text-primary underline">Vezi atelierul</a>
              </div>
            ))}
          </div>
        </div>
      )}
      {!searching && productResults.length > 0 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Rezultate produse</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productResults.map(product => (
              <ListingCard key={product.id} listing={product} />
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative rounded-lg shadow-xl overflow-hidden text-center min-h-[400px] md:min-h-[500px] flex flex-col justify-center items-center p-8 bg-card">
        <Image
          src="https://picsum.photos/seed/hero_ioty_artizanat_ro/1600/900"
          alt="Fundal cu unelte de meșteșugar și creații artizanale diverse din românia"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 pointer-events-none opacity-30"
          data-ai-hint="atelier artizanal românesc"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground mb-6 leading-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
            ioty.ro: Tărâmul <span className="text-primary">meșteșugului</span> autentic!
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
            Descoperă făurituri unice, pline de har și poveste, create de meșteri iscusiți din România. Fiecare obiect poartă o scânteie de magie!
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/80 text-primary-foreground text-lg px-8 py-3 rounded-md shadow-lg transition-transform hover:scale-105">
            <Link href="/category/all">
              Răsfoiește toate minunățiile <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Comori alese pe sprânceană</h2>
          <Button variant="link" asChild className="text-primary hover:text-accent text-md">
            <Link href="/category/featured">
              Vezi toată colecția de suflet <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {/* Refactor featured listings and shops to use Firestore only. */}

      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Explorează tărâmuri meșteșugite</h2>
        {categoriesToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriesToDisplay.map((category) => (
              <Link key={category.href} href={category.href} className="group block">
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 bg-card h-full flex flex-col border hover:border-primary">
                  <div className="relative h-56 w-full">
                    <Image
                      src={category.imageUrl}
                      alt={`Imagine reprezentativă pentru categoria ${category.name}`}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={category.imageHint}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <CardContent className="p-5 flex-grow flex flex-col justify-end relative -mt-16 z-10">
                    <h3 className="text-xl font-semibold text-primary-foreground group-hover:text-primary mb-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{category.name}</h3>
                    <Button variant="secondary" size="sm" className="mt-2 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Descoperă tărâmul
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground">Tărâmuri neexplorate (încă!)</h3>
            <p className="text-muted-foreground mt-2">Categoriile de minunății vor apărea aici pe măsură ce tărâmul ioty crește.</p>
          </div>
        )}
      </section>

      {/* Featured Shops Section */}
      <section>
        <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Ateliere noi și strălucitoare</h2>
        {/* Refactor featured listings and shops to use Firestore only. */}
      </section>

      {/* Call to Action for Sellers */}
      <section className="bg-gradient-to-br from-accent/30 via-secondary/30 to-background rounded-lg p-10 text-center shadow-md">
        <HandHeart className="mx-auto h-16 w-16 text-primary mb-5" />
        <h2 className="text-3xl font-bold text-foreground mb-4">Ești meșter faur? Arată lumii ce har ai!</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
          Ai un har de meșter? Deschide-ți atelierul pe ioty.ro și uimește o lume întreagă cu făuriturile tale! E simplu și plin de magie.
        </p>
        <Button size="lg" asChild className="bg-primary hover:bg-primary/80 text-primary-foreground text-lg px-10 py-3 rounded-md shadow-lg transition-transform hover:scale-105">
          <Link href="/account/create-shop"> 
            Lansează-ți făuriturile <Sparkles className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
