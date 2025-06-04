// src/app/account/page.tsx
"use client";

import { AccountDashboard } from '@/components/account/AccountDashboard';
import { useEffect, useState } from 'react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function MyAccountPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch shop info
        const shopDoc = await getDoc(doc(db, 'shops', user.uid));
        let userWithShop = {
          ...user,
          hasShop: false,
          shopId: undefined,
          shopName: undefined,
        };
        if (shopDoc.exists()) {
          const shopData = shopDoc.data();
          userWithShop.hasShop = true;
          userWithShop.shopId = shopData.id;
          userWithShop.shopName = shopData.name;
        }
        setCurrentUser(userWithShop);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <p className="text-muted-foreground">Se încarcă tărâmul personal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <PlaceholderContent
        title="Colțișor necunoscut"
        description="Pentru a accesa colțișorul tău magic, te rugăm să intri mai întâi în Tărâmul ioty."
        icon={LogIn}
      >
        <Button asChild className="mt-6">
            <Link href="/login">Intră în tărâm</Link>
        </Button>
      </PlaceholderContent>
    );
  }

  return <AccountDashboard user={currentUser} />;
}
