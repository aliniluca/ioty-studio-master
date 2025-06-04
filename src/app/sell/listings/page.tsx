"use client";

import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { WandSparkles, AlertTriangle, Store } from 'lucide-react'; 
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProductDetails, ListingStatus } from '@/lib/mock-data-types'; 
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const getStatusBadgeVariant = (status: ListingStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'approved':
      return 'default'; // Greenish in theme
    case 'pending_approval':
      return 'secondary'; // Bluish/Yellowish in theme
    case 'rejected':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusBadgeClasses = (status: ListingStatus): string => {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    case 'pending_approval':
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
    case 'rejected':
      return 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
    case 'draft':
      return 'bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

const statusTranslations: Record<ListingStatus, string> = {
  approved: "În târg",
  pending_approval: "Așteaptă aprobarea",
  rejected: "Respinsă",
  draft: "Ciornă"
};

export default function SellerListingsPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [sellerListings, setSellerListings] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch shop
        const shopDoc = await getDoc(doc(db, 'shops', user.uid));
        if (shopDoc.exists()) {
          setShop(shopDoc.data());
          // Fetch listings for this shop/user
          const listingsQuery = query(collection(db, 'listings'), where('sellerId', '==', user.uid));
          const listingsSnap = await getDocs(listingsQuery);
          const listings = listingsSnap.docs.map(doc => doc.data());
          setSellerListings(listings);
        } else {
          setShop(null);
          setSellerListings([]);
        }
      } else {
        setShop(null);
        setSellerListings([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <p className="text-muted-foreground">Se încarcă atelierul...</p>
      </div>
    );
  }

  if (!currentUser || !shop) {
    return (
      <PlaceholderContent
        title="Trebuie să ai un atelier"
        description="Pentru a-ți orândui minunățiile, mai întâi trebuie să-ți deschizi un atelier în tărâmul ioty."
        icon={StoreIcon}
      >
        <Button asChild className="mt-6">
          <Link href="/account/create-shop">
            Deschide atelierul
          </Link>
        </Button>
      </PlaceholderContent>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground">Orânduiește-ți minunățiile din atelier</h1>
            <p className="text-muted-foreground">Privește, șlefuiește și adaugă noi comori în atelierul tău virtual, meștere iscusit.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/sell/listings/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Făurește o nouă minunăție
          </Link>
        </Button>
      </div>

      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle>Comorile tale din târg ({sellerListings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sellerListings.length === 0 ? (
            <div className="text-center py-12">
                <WandSparkles className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-card-foreground mb-2">Atelierul e cam goluț, meștere!</h2>
                <p className="text-muted-foreground mb-6">E timpul să aduci prima ta minunăție la lumină, să încânți tărâmul ioty!</p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/sell/listings/new">Făurește prima comoară</Link>
                </Button>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Chipul comorii</TableHead>
                <TableHead>Numele minunăției</TableHead>
                <TableHead className="text-right">Valoare (RON)</TableHead>
                <TableHead className="text-center">Stoc</TableHead>
                <TableHead className="text-center">Starea magiei</TableHead>
                <TableHead className="text-right">Ochi curioși</TableHead>
                <TableHead className="text-right w-[50px]">Unelte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellerListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                        <Image 
                            src={listing.images[0]?.url || `https://picsum.photos/seed/${listing.id}/80/80`} 
                            alt={listing.name} 
                            layout="fill" 
                            objectFit="cover" 
                            data-ai-hint={listing.dataAiHint || 'imagine produs'} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground hover:text-primary">
                    <Link href={`/products/${listing.id}`}>{listing.name}</Link>
                  </TableCell>
                  <TableCell className="text-right">{listing.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{listing.stock}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(listing.status)} className={getStatusBadgeClasses(listing.status)}>
                       {listing.status === 'pending_approval' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {statusTranslations[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{listing.reviewCount * 20}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Unelte</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/products/${listing.id}`} className="flex items-center"><Eye className="mr-2 h-4 w-4" /> Privește comoara în târg</Link></DropdownMenuItem>
                        {/* <DropdownMenuItem asChild><Link href={`/sell/listings/${listing.id}/edit`} className="flex items-center"><Edit className="mr-2 h-4 w-4" /> Șlefuiește detaliile</Link></DropdownMenuItem> */}
                        {/* Add Edit link later when edit page is implemented */}
                        <DropdownMenuItem className="flex items-center cursor-not-allowed opacity-50"><Edit className="mr-2 h-4 w-4" /> Șlefuiește (în curând)</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> Fă-o să dispară din târg (simulare)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
        {sellerListings.length > 0 && (
            <CardFooter className="border-t pt-4">
                <p className="text-xs text-muted-foreground">De aici poți orândui toate minunățiile din atelierul tău, ca un adevărat meșter al tărâmului ioty.</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Helper needed for PlaceholderContent if StoreIcon is not available by default
const StoreIcon = Store;
