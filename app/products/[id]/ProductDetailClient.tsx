"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addToCartFirestore, addToCartLocalStorage } from "@/lib/cart-utils";
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
import type { Review as ReviewType, ProductDetails, ShopDetails, CartItem } from '@/lib/mock-data-types'; 
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Cart functions are now imported from cart-utils
function addToWishlistFirestore(userId: string, productId: string) {
  return setDoc(doc(db, 'users', userId, 'wishlist', productId), { addedAt: new Date() });
}
function removeFromWishlistFirestore(userId: string, productId: string) {
  return deleteDoc(doc(db, 'users', userId, 'wishlist', productId));
}

interface ProductDetailClientProps {
  params: { id: string };
}

export default function ProductDetailClient({ params }: ProductDetailClientProps) {
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<ShopDetails | null>(null);
  const [reapplying, setReapplying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDetails | null>(null);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        if (typeof params.id !== 'string') {
          console.error('params.id is not a string:', params.id, typeof params.id);
          setProduct({
            id: '',
            name: '',
            description: '',
            price: 0,
            shippingPrice: 0,
            shippingTime: '',
            images: [],
            sellerId: '',
            seller: { id: '', name: '' },
            rating: 0,
            reviewCount: 0,
            stock: 0,
            category: '',
            categorySlug: '',
            tags: [],
            reviews: [],
            status: 'draft',
            dateAdded: '',
          });
          setLoading(false);
          return;
        }
        console.log("Fetching product:", params.id);
        const docRef = doc(db, "listings", params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Product data:", docSnap.data());
          const productData = docSnap.data() as ProductDetails;
          setProduct(productData);
          
          // Fetch seller information if product has a sellerId
          if (productData.sellerId) {
            try {
              const sellerRef = doc(db, 'shops', productData.sellerId);
              const sellerSnap = await getDoc(sellerRef);
              if (sellerSnap.exists()) {
                const sellerData = { id: sellerSnap.id, ...sellerSnap.data() } as ShopDetails;
                setSeller(sellerData);
              } else {
                setSeller(null);
              }
            } catch (error) {
              console.error("Error fetching seller:", error);
              setSeller(null);
            }
          }
        } else {
          console.log("Product not found");
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  useEffect(() => {
    if (currentUserId && product) {
      getDoc(doc(db, 'users', currentUserId, 'wishlist', product.id)).then(docSnap => {
        setIsFavorite(docSnap.exists());
      });
    }
  }, [currentUserId, product]);

  const handleReapply = async () => {
    if (!product) return;
    setReapplying(true);
    try {
      const docRef = doc(db, "listings", params.id);
      await setDoc(docRef, { status: 'pending_approval' }, { merge: true });
      toast({ title: 'Trimis la moderare', description: 'Anunțul a fost retrimis pentru aprobare.' });
      // Optionally, refetch product
      setProduct({ ...product, status: 'pending_approval' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Reîncercarea a eșuat. Încearcă din nou.' });
    } finally {
      setReapplying(false);
    }
  };

  // Handler for edit button
  const handleEdit = () => {
    setEditProduct(product ? { ...product } : null);
    setEditMode(true);
  };

  // Handler for cancel button
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditProduct(null);
  };

  // Handler for save button
  const handleSaveEdit = async () => {
    if (!editProduct) return;
    try {
      const docRef = doc(db, "listings", params.id);
      await setDoc(docRef, editProduct, { merge: true });
      setProduct(editProduct);
      setEditMode(false);
      toast({ title: 'Salvat', description: 'Modificările au fost salvate.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Eroare la salvarea modificărilor.' });
    }
  };

  // Handler for edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProduct) return;
    const { name, value } = e.target;
    setEditProduct({ ...editProduct, [name]: value });
  };

  const handleAddToCart = async () => {
    alert('Button clicked! Function called!'); // Test alert
    console.log('handleAddToCart called!');
    console.log('Product:', product);
    console.log('Quantity:', quantity);
    console.log('Current user ID:', currentUserId);
    
    if (!product) {
      console.log('No product available');
      toast({ variant: 'destructive', title: 'Eroare', description: 'Produs indisponibil' });
      return;
    }

    // Validate required fields
    if (!product.id || !product.name || product.price === undefined) {
      console.log('Product validation failed:', { id: product.id, name: product.name, price: product.price });
      toast({ variant: 'destructive', title: 'Eroare', description: 'Datele produsului sunt incomplete' });
      return;
    }

    const item: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0]?.url || '',
      quantity,
      seller: seller?.name || 'Unknown Seller',
      productId: product.id,
      dataAiHint: product.dataAiHint,
    };

    console.log('Adding item to cart:', item);
    console.log('Current user ID:', currentUserId);

    if (currentUserId) {
      try {
        console.log('Attempting to add to Firestore cart...');
        // Write cart item
        const success = await addToCartFirestore(currentUserId, item);
        if (success) {
          console.log('Successfully added to Firestore cart');
          toast({ title: 'Adăugat în coș!', description: 'Produsul a fost adăugat în coșul tău.' });
        } else {
          console.log('Firestore failed, using localStorage fallback');
          toast({ title: 'Adăugat în coș!', description: 'Produsul a fost adăugat în coșul tău (mod local).' });
        }
      } catch (e) {
        console.error('Error adding to Firestore cart:', e);
        // Fall back to localStorage
        addToCartLocalStorage(item);
        toast({ title: 'Adăugat în coș!', description: 'Produsul a fost adăugat în coșul tău (mod local).' });
      }
    } else {
      console.log('No user ID, adding to localStorage cart...');
      addToCartLocalStorage(item); // fallback to localStorage
      console.log('Successfully added to localStorage cart');
      toast({ title: 'Adăugat în coș!', description: 'Produsul a fost adăugat în coșul tău.' });
    }
    
    console.log('handleAddToCart completed');
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    if (!currentUserId) {
      toast({ variant: 'destructive', title: 'Autentificare necesară', description: 'Intră în cont pentru a salva la favorite.' });
      return;
    }
    try {
      if (isFavorite) {
        await removeFromWishlistFirestore(currentUserId, product.id);
        setIsFavorite(false);
        toast({ title: 'Eliminat din favorite' });
      } else {
        await addToWishlistFirestore(currentUserId, product.id);
        setIsFavorite(true);
        toast({ title: 'Adăugat la favorite' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Eroare', description: 'Eroare la favorite.' });
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Se încarcă...</div>;
  }

  if (typeof params.id !== 'string') {
    return (
      <PlaceholderContent
        title="Eroare: ID produs lipsă"
        description="Nu a fost furnizat un ID valid pentru produs. Încercați să accesați această pagină din lista de produse."
        icon={AlertTriangle}
      />
    );
  }

  if (!product) {
    return (
         <PlaceholderContent
            title="Comoară de negăsit"
            description="Se pare că această minunăție s-a rătăcit prin târgul fermecat, nu a fost încă făurită, sau poate meșterul a luat-o la șlefuit. Încearcă o altă căutare magică!"
            icon={PackageSearch}
        />
    );
  }

  if (product.status === 'rejected' && product.sellerId !== currentUserId) {
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

  // Owner edit mode UI
  if (editMode && editProduct) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Editează Minunăția</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Nume</label>
            <input
              className="w-full border rounded px-3 py-2"
              name="name"
              value={editProduct.name}
              onChange={handleEditChange}
              placeholder="Numele produsului"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Descriere</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              name="description"
              value={editProduct.description}
              onChange={handleEditChange}
              rows={5}
              placeholder="Descrierea produsului"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Preț (RON)</label>
            <input
              className="w-full border rounded px-3 py-2"
              name="price"
              type="number"
              value={editProduct.price}
              onChange={handleEditChange}
              placeholder="Prețul în RON"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Stoc</label>
            <input
              className="w-full border rounded px-3 py-2"
              name="stock"
              type="number"
              value={editProduct.stock}
              onChange={handleEditChange}
              placeholder="Număr de bucăți în stoc"
            />
          </div>
          {/* Add more fields as needed */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveEdit} className="bg-primary text-primary-foreground">Salvează</Button>
            <Button variant="outline" onClick={handleCancelEdit}>Renunță</Button>
          </div>
        </div>
      </div>
    );
  }

  // Product is available (approved or pending_approval)
  const isOwner = product.sellerId === currentUserId;

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
      {product.status === 'rejected' && isOwner && (
        <Card className="mb-6 bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-200">Acest anunț a fost respins de moderatori.</p>
              <p className="text-sm text-red-700 dark:text-red-300">Editează detaliile și reîncearcă să-l trimiți spre aprobare.</p>
            </div>
            <Button onClick={handleReapply} disabled={reapplying} className="bg-primary text-primary-foreground">
              {reapplying ? 'Se retrimite...' : 'Trimite din nou la aprobare'}
            </Button>
          </CardContent>
        </Card>
      )}
      {isOwner && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={handleEdit}>Editează</Button>
        </div>
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
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus className="h-4 w-4"/></Button>
                    <span className="px-4 text-sm font-medium">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => q+1)}><Plus className="h-4 w-4"/></Button>
                </div>
            </div>
            
            {/* Debug info */}
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              Debug: Stock: {product?.stock}, Status: {product?.status}, Button disabled: {product?.stock === 0 || product?.status !== 'approved'}
            </div>
            
            {/* Test button for toast */}
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Test', description: 'Toast is working!' })}>
              Test Toast
            </Button>
            
            {/* Test button for basic functionality */}
            <Button variant="outline" size="sm" onClick={() => {
              console.log('Basic button clicked!');
              alert('Basic button works!');
            }}>
              Test Basic Button
            </Button>
            
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" /> Adaugă în coșulețul fermecat
            </Button>
            <div className="flex gap-2">
                <Button variant={isFavorite ? "default" : "outline"} size="icon" onClick={handleToggleFavorite} disabled={!currentUserId}>
                  <Heart className={isFavorite ? 'text-destructive' : ''} />
                  <span className="sr-only">{isFavorite ? 'Elimină din favorite' : 'Pune la inimă'}</span>
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

          {/* Add null check for product.tags */}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
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
            {(Array.isArray(product.reviews) && product.reviews.length > 0) ? product.reviews.map((review: ReviewType) => (
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