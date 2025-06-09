// src/app/sell/orders/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Fetch orders for this seller
        const q = query(
          collection(db, 'orders'),
          where('sellerId', '==', user.uid),
          orderBy('created', 'desc')
        );
        const querySnapshot = await getDocs(q);
        setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setUserId(null);
        setOrders([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!userId) {
    return <PlaceholderContent title="Nu ești autentificat" description="Te rugăm să te autentifici pentru a vedea comenzile atelierului tău." />;
  }

  if (orders.length === 0) {
    return <PlaceholderContent title="Nicio comandă găsită" description="Nu ai primit încă nicio comandă. Când vei primi, le vei vedea aici!" icon={PackageCheck} />;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Comenzile atelierului tău</h1>
      {orders.map(order => (
        <Card key={order.id} className="mb-4">
          <CardHeader>
            <CardTitle>Comandă #{order.id.slice(-6).toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-muted-foreground text-sm">Plasată pe: {order.created?.toDate ? order.created.toDate().toLocaleString() : new Date(order.created).toLocaleString()}</div>
                <div className="text-muted-foreground text-sm">Email client: {order.customer_email}</div>
              </div>
              <div className="text-lg font-bold">{(order.amount_total / 100).toFixed(2)} {order.currency?.toUpperCase() || 'RON'}</div>
              <div className="text-sm">Status: <span className="font-semibold">{order.payment_status}</span></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
