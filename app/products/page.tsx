import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/shared/StarRating';
import type { ProductDetails } from '@/lib/mock-data-types';

export default async function ProductsPage() {
  // Fetch all products from Firestore
  let products: ProductDetails[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'listings'));
    products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductDetails[];
  } catch (e) {
    // handle error or show fallback UI
    return <div className="text-center py-10 text-muted-foreground">Eroare la încărcarea produselor.</div>;
  }

  if (!products.length) {
    return <div className="text-center py-10 text-muted-foreground">Nu există produse disponibile.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Toate produsele</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Image
                  src={product.images?.[0] || '/placeholder.png'}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="object-cover w-full h-48 rounded"
                />
                <CardTitle className="mt-2 text-lg font-semibold">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-accent font-bold text-xl">{product.price?.toFixed(2)} RON</span>
                  <StarRating rating={product.rating} reviewCount={product.reviewCount} size={16} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">{product.category}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 