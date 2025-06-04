import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, HandHeart, Search, PackageOpen, Store as StoreIcon } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader, CardTitle
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navigationCategories } from '@/lib/nav-data'; 
import { ListingCard } from '@/components/shared/ListingCard';
import type { ShopDetails, ProductDetails } from '@/lib/mock-data-types';

const categoriesToDisplay = navigationCategories.slice(0, 4).map(cat => ({
  name: cat.label,
  href: cat.href,
  imageUrl: `https://picsum.photos/seed/hp_cat_${cat.slug}/300/200`, 
  imageHint: cat.dataAiHint || cat.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), 
}));

export default function HomePage() {
  // Refactor featured listings and shops to use Firestore only.

  return (
    <div className="space-y-16">
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
