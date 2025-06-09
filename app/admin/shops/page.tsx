"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { getIdTokenResult } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminShopsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const tokenResult = await getIdTokenResult(user, true);
        setIsAdmin(!!tokenResult.claims.admin);
        if (!!tokenResult.claims.admin) {
          // Fetch shops from Firestore
          const shopsSnap = await getDocs(collection(db, 'shops'));
          // Fetch owner email for each shop
          const shopsWithOwner = await Promise.all(shopsSnap.docs.map(async docSnap => {
            const shop = { id: docSnap.id, ...docSnap.data() };
            let ownerEmail = '';
            if (shop.userId) {
              const ownerDoc = await getDoc(doc(db, 'users', shop.userId));
              ownerEmail = ownerDoc.exists() ? ownerDoc.data().email : '';
            }
            return { ...shop, ownerEmail };
          }));
          setShops(shopsWithOwner);
        }
      } else {
        setIsAdmin(false);
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleBanToggle = async (shopId: string, banned: boolean) => {
    setUpdating(shopId);
    await updateDoc(doc(db, 'shops', shopId), { banned: !banned });
    setShops(shops => shops.map(s => s.id === shopId ? { ...s, banned: !banned } : s));
    setUpdating(null);
  };

  const handleApprove = async (shopId: string) => {
    setUpdating(shopId);
    await updateDoc(doc(db, 'shops', shopId), { approved: true });
    setShops(shops => shops.map(s => s.id === shopId ? { ...s, approved: true } : s));
    setUpdating(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">Se încarcă atelierele...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-10">Nu ai acces la această zonă.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Gestionare Ateliere</h1>
      <Card>
        <CardHeader><CardTitle>Ateliere</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Nume atelier</th>
                <th className="py-2">Proprietar</th>
                <th className="py-2">Status</th>
                <th className="py-2">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.id} className={shop.banned ? 'opacity-50' : ''}>
                  <td className="py-2">{shop.name}</td>
                  <td className="py-2">{shop.ownerEmail}</td>
                  <td className="py-2">{shop.banned ? 'Blocat' : shop.approved ? 'Aprobat' : 'Neaprobat'}</td>
                  <td className="py-2 flex gap-2">
                    <Button size="sm" variant={shop.banned ? 'outline' : 'destructive'} disabled={updating === shop.id} onClick={() => handleBanToggle(shop.id, shop.banned)}>
                      {shop.banned ? 'Deblochează' : 'Blochează'}
                    </Button>
                    {!shop.approved && !shop.banned && (
                      <Button size="sm" variant="secondary" disabled={updating === shop.id} onClick={() => handleApprove(shop.id)}>
                        Aprobă atelier
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 