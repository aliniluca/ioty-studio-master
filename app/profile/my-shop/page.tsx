"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, 
  Package, 
  Star, 
  Users, 
  Calendar, 
  Edit, 
  Plus,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface ShopData {
  id: string;
  name: string;
  tagline?: string;
  bio?: string;
  category?: string;
  avatarUrl?: string;
  shopRating?: number;
  shopReviewCount?: number;
  status?: 'active' | 'pending' | 'suspended';
  createdAt?: any;
  totalSales?: number;
  totalProducts?: number;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  status: 'approved' | 'pending_approval' | 'rejected';
  rating?: number;
  reviewCount?: number;
  createdAt?: any;
}

export default function MyShopPage() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchShopData(user.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchShopData = async (uid: string) => {
    try {
      // Use the same logic as AccountDashboard - look for shop document with user UID as document ID
      const shopDoc = await getDoc(doc(db, 'shops', uid));
      
      if (!shopDoc.exists()) {
        // User doesn't have a shop yet
        setShopData(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      const shop = { id: shopDoc.id, ...shopDoc.data() } as ShopData;
      setShopData(shop);

      // Fetch shop's products
      const productsQuery = query(
        collection(db, 'listings'), 
        where('sellerId', '==', uid)
      );
      const productsSnap = await getDocs(productsQuery);
      const shopProducts = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductData[];
      
      setProducts(shopProducts);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">În așteptare</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500">Suspendat</Badge>;
      default:
        return <Badge variant="secondary">Necunoscut</Badge>;
    }
  };

  const getProductStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprobat</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-500">În așteptare</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Respins</Badge>;
      default:
        return <Badge variant="secondary">Necunoscut</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!shopData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-4">Nu ai încă un atelier</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Creează-ți atelierul pentru a începe să vinzi minunățiile tale unice!
            </p>
            <Button asChild size="lg">
              <Link href="/account/create-shop">
                <Plus className="mr-2 h-5 w-5" />
                Creează atelierul meu
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const approvedProducts = products.filter(p => p.status === 'approved');
  const pendingProducts = products.filter(p => p.status === 'pending_approval');
  const totalRevenue = approvedProducts.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Atelierul meu</h1>
            <p className="text-muted-foreground">Gestionează-ți atelierul și produsele</p>
          </div>
          <Button asChild>
            <Link href={`/account/edit-shop`}>
              <Edit className="mr-2 h-4 w-4" />
              Editează atelierul
            </Link>
          </Button>
        </div>

        {/* Shop Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {shopData.avatarUrl ? (
                  <img 
                    src={shopData.avatarUrl} 
                    alt={shopData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{shopData.name}</h2>
                  {getStatusBadge(shopData.status || 'pending')}
                </div>
                {shopData.tagline && (
                  <p className="text-muted-foreground">{shopData.tagline}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{products.length}</div>
                <div className="text-sm text-muted-foreground">Produse</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{shopData.shopRating?.toFixed(1) || '0'}</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{shopData.shopReviewCount || 0}</div>
                <div className="text-sm text-muted-foreground">Recenzii</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{totalRevenue.toFixed(0)} RON</div>
                <div className="text-sm text-muted-foreground">Vânzări</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild variant="outline" className="h-20">
            <Link href="/sell/listings/new">
              <Plus className="mr-2 h-5 w-5" />
              Adaugă produs nou
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20">
            <Link href="/sell/orders">
              <Package className="mr-2 h-5 w-5" />
              Vezi comenzile
            </Link>
          </Button>
        </div>

        {/* Products Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Produsele mele</CardTitle>
              <Button asChild size="sm">
                <Link href="/sell/listings">
                  Vezi toate produsele
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nu ai încă produse</h3>
                <p className="text-muted-foreground mb-4">
                  Începe să adaugi produse pentru a-ți crea atelierul!
                </p>
                <Button asChild>
                  <Link href="/sell/listings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Adaugă primul produs
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.slice(0, 6).map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold truncate">{product.name}</h4>
                        {getProductStatusBadge(product.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{product.price.toFixed(2)} RON</span>
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {products.length > 6 && (
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link href="/sell/listings">
                        Vezi toate {products.length} produse
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Produse aprobate</span>
              </div>
              <div className="text-2xl font-bold mt-2">{approvedProducts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">În așteptare</span>
              </div>
              <div className="text-2xl font-bold mt-2">{pendingProducts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Valoare totală</span>
              </div>
              <div className="text-2xl font-bold mt-2">{totalRevenue.toFixed(0)} RON</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 