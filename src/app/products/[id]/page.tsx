import Image from 'next/image';
import { StarRating } from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Minus, Plus, Send, Share2, ShoppingCart, Store, PackageSearch, AlertTriangle } from 'lucide-react'; 
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { ProductImageCarousel } from '@/components/product/ProductImageCarousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Review as ReviewType, ProductDetails, ShopDetails } from '@/lib/mock-data-types'; 
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';

export async function generateStaticParams() {
  // In a real app, this would fetch all product IDs. For mock, it's empty.
  return [];
}

export default function ProductDetailPage({ params }: { params: { id:string } }) {
  // Refactor product and shop details to use Firestore only.

  if (!product) {
    return (
         <PlaceholderContent
            title="Comoară de negăsit"
            description="Se pare că această minunăție s-a rătăcit prin târgul fermecat, nu a fost încă făurită, sau poate meșterul a luat-o la șlefuit. Încearcă o altă căutare magică!"
            icon={PackageSearch}
        />
    );
  }

  if (product.status === 'rejected') {
     return (
         <PlaceholderContent
            title="Minunăție retrasă din târg"
            description="Această făuritură nu mai este disponibilă în Tărâmul ioty. Poate găsești alte comori?"
            icon={AlertTriangle}
        />
    );
  }
  
    if (product.status === 'draft') {
     return (
         <PlaceholderContent
            title="Minunăție în pregătire"
            description="Meșterul încă lucrează la această făuritură. Revino curând să vezi cum a prins viață!"
            icon={PackageSearch} // Or a different icon like Hourglass
        />
    );
  }


  // Product is available (approved or pending_approval)
  
  return (
    <div className="max-w-6xl mx-auto">
       {product.status === 'pending_approval' && (
        <Card className="mb-6 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">Minunăție în așteptarea aprobării</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Această făuritură este vizibilă doar pentru tine și pentru zânele tărâmului. Va străluci pentru toți călătorii după ce primește binecuvântarea.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <ProductImageCarousel images={product.images} />

        <div className="space-y-6">
          <div>
            <Link href={`/category/${product.categorySlug}${product.subcategorySlug ? `?subcategory=${product.subcategorySlug}`: ''}`} className="text-sm text-primary hover:underline">{product.subcategoryName ? `${product.subcategoryName} - ${product.category}` : product.category}</Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mt-1">{product.name}</h1>
            <div className="mt-2">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} size={20} />
            </div>
          </div>

          <p className="text-3xl font-bold text-accent">{product.price.toFixed(2)} RON</p>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Drumul comorii (transport): {product.shippingPrice.toFixed(2)} RON</p>
            <p>Ajunge la tine în: {product.shippingTime}</p>
            <p className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
              {product.stock > 0 ? `${product.stock} ${product.stock === 1 ? 'gata de drum!' : 'gata de drum!'}` : (product.stock === 0 ? "stoc epuizat momentan" : "a zburat din cuib!")}
            </p>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-4">
                <p className="text-sm font-medium">Câte bucăți de magie dorești?</p>
                <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9"><Minus className="h-4 w-4"/></Button>
                    <span className="px-4 text-sm font-medium">1</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9"><Plus className="h-4 w-4"/></Button>
                </div>
            </div>
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={product.stock === 0 || product.status !== 'approved'}>
              <ShoppingCart className="mr-2 h-5 w-5" /> Adaugă în coșulețul fermecat
            </Button>
            <div className="flex gap-2">
                <Button variant="outline" className="w-full">
                <Heart className="mr-2 h-5 w-5" /> Pune la păstrare în inimă
                </Button>
                <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                    <span className="sr-only">Împarte magia</span>
                </Button>
            </div>
          </div>
          
          <Separator />

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Povestea minunăției</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
                {product.tags.map(tag => (
                <Link key={tag} href={`/category/all?q=${encodeURIComponent(tag)}`} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full hover:bg-secondary hover:text-secondary-foreground">
                    #{tag}
                </Link>
                ))}
            </div>
          )}

          <Separator />

          {seller && (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Fă cunoștință cu meșterul faur</CardTitle>
              </CardHeader>
              <CardContent className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={seller.avatarUrl} alt={seller.name} data-ai-hint={seller.dataAiHintAvatar || 'portret meșter'} />
                  <AvatarFallback>{seller.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <Link href={`/shop/${seller.id}`} className="text-lg font-semibold text-primary hover:underline">
                    {seller.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{seller.location}</p>
                  <div className="text-sm text-muted-foreground mt-1">
                    <StarRating rating={seller.shopRating} reviewCount={seller.shopReviewCount} size={14} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">În breaslă din {seller.memberSince}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/shop/${seller.id}`}>
                    <Store className="mr-2 h-4 w-4" /> Intră în atelierul meșterului
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator className="my-12" />
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Ce zic alți călători prin tărâmul ioty ({product.reviewCount})</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {product.reviews.length > 0 ? product.reviews.map((review: ReviewType) => (
              <Card key={review.id} className="bg-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={review.user.avatarUrl} alt={review.user.name} data-ai-hint={review.user.dataAiHint || 'chip utilizator'} />
                      <AvatarFallback>{review.user.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-card-foreground">{review.user.name}</h4>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <StarRating rating={review.rating} size={16} />
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
                <p className="text-muted-foreground text-center md:text-left">Nicio poveste nu a fost încă lăsată pentru această minunăție. Fii tu primul care scrie o amintire!</p>
            )}
          </div>
          <div className="sticky top-24 self-start">
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="text-xl">Lasă o vorbă de duh (sau de drag)</CardTitle>
                    <CardDescription>Spune-ne cum te-a vrăjit această făuritură!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">Cât de tare te-a fermecat? (1-5 stele)</p>
                        <StarRating rating={0} size={24} isEditable />
                    </div>
                    <Textarea placeholder="Descrie-ne aventura ta cu acest obiect fermecat..." rows={5} />
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Send className="mr-2 h-4 w-4"/> Trimite povestea ta în lume
                    </Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
