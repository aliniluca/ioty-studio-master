// src/app/account/create-shop/page.tsx
"use client";

import { CreateShopForm } from '@/components/account/CreateShopForm';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CreateShopPage() {
  const router = useRouter();
  const [userHasShop, setUserHasShop] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if shop exists for this user in Firestore (assuming shop doc id is user.uid)
        const shopDoc = await getDoc(doc(db, 'shops', user.uid));
        setUserHasShop(shopDoc.exists());
      } else {
        setUserHasShop(false);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (userHasShop === null) {
    return <div className="text-center py-10"><p className="text-muted-foreground">Se verifică atelierul...</p></div>;
  }

  if (userHasShop) {
     return (
        <PlaceholderContent
            title="Atelier deja făurit!"
            description="Se pare că ai deja un atelier magic în Tărâmul ioty. Poți să-l orânduiești din contul tău."
            icon={Store}
        >
            <Button asChild className="mt-6"><Link href="/account">Mergi la contul meu</Link></Button>
        </PlaceholderContent>
     );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card shadow-xl">
        <CardHeader className="text-center">
          <Store className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-card-foreground">Deschide-ți atelierul fermecat!</CardTitle>
          <CardDescription className="text-muted-foreground">
            E timpul să-ți aduci minunățiile în Tărâmul ioty. Completează detaliile de mai jos și pornește la drum!
          </CardDescription>
        </CardHeader>
        <CreateShopForm />
      </Card>
    </div>
  );
}
