"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getIdTokenResult } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{users: number, shops: number, listings: number, orders: number}>({users: 0, shops: 0, listings: 0, orders: 0});
  const [growth, setGrowth] = useState<{labels: string[], users: number[], shops: number[], orders: number[]}>({labels: [], users: [], shops: [], orders: []});
  const [topShops, setTopShops] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const tokenResult = await getIdTokenResult(user, true);
        setIsAdmin(!!tokenResult.claims.admin);
        if (!!tokenResult.claims.admin) {
          // Fetch analytics counts
          const [usersSnap, shopsSnap, listingsSnap, ordersSnap] = await Promise.all([
            getCountFromServer(collection(db, 'users')),
            getCountFromServer(collection(db, 'shops')),
            getCountFromServer(collection(db, 'listings')),
            getCountFromServer(collection(db, 'orders')),
          ]);
          setStats({
            users: usersSnap.data().count,
            shops: shopsSnap.data().count,
            listings: listingsSnap.data().count,
            orders: ordersSnap.data().count,
          });
          // Growth over last 6 months
          const now = new Date();
          const months = Array.from({length: 6}, (_, i) => subMonths(now, 5-i));
          const labels = months.map(m => format(m, 'MMM yyyy'));
          const usersCol = collection(db, 'users');
          const shopsCol = collection(db, 'shops');
          const ordersCol = collection(db, 'orders');
          const usersCounts = await Promise.all(months.map(async m => {
            const snap = await getDocs(usersCol);
            return snap.docs.filter(doc => {
              const d = doc.data().createdAt ? new Date(doc.data().createdAt) : null;
              return d && d >= startOfMonth(m) && d <= endOfMonth(m);
            }).length;
          }));
          const shopsCounts = await Promise.all(months.map(async m => {
            const snap = await getDocs(shopsCol);
            return snap.docs.filter(doc => {
              const d = doc.data().memberSince ? new Date(doc.data().memberSince) : null;
              return d && d >= startOfMonth(m) && d <= endOfMonth(m);
            }).length;
          }));
          const ordersCounts = await Promise.all(months.map(async m => {
            const snap = await getDocs(ordersCol);
            return snap.docs.filter(doc => {
              const d = doc.data().created ? new Date(doc.data().created) : null;
              return d && d >= startOfMonth(m) && d <= endOfMonth(m);
            }).length;
          }));
          setGrowth({labels, users: usersCounts, shops: shopsCounts, orders: ordersCounts});
          // Top 5 shops by rating and reviews
          const shopsSnapAll = await getDocs(collection(db, 'shops'));
          const shopsArr = shopsSnapAll.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const top = shopsArr.filter(s => s.shopRating && s.shopReviewCount).sort((a, b) => (b.shopRating - a.shopRating) || (b.shopReviewCount - a.shopReviewCount)).slice(0, 5);
          setTopShops(top);
        }
      } else {
        setIsAdmin(false);
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">Se verifică permisiunile...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-10">Nu ai acces la această zonă.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Panou Admin</h1>
      {/* Analytics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.users}</div><div className="text-muted-foreground">Utilizatori</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.shops}</div><div className="text-muted-foreground">Ateliere</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.listings}</div><div className="text-muted-foreground">Produse</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.orders}</div><div className="text-muted-foreground">Comenzi</div></CardContent></Card>
      </div>
      {/* Growth charts */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Evoluție ultimele 6 luni</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Lună</th>
                {growth.labels.map(label => <th key={label}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Utilizatori</td>
                {growth.users.map((v, i) => <td key={i}>{v}</td>)}
              </tr>
              <tr>
                <td>Ateliere</td>
                {growth.shops.map((v, i) => <td key={i}>{v}</td>)}
              </tr>
              <tr>
                <td>Comenzi</td>
                {growth.orders.map((v, i) => <td key={i}>{v}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Top shops */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Top 5 ateliere</h2>
        <ul className="space-y-2">
          {topShops.map(shop => (
            <li key={shop.id} className="border rounded p-2 flex items-center gap-2">
              <span className="font-semibold">{shop.name}</span>
              <span className="text-yellow-500">{shop.shopRating?.toFixed(1)}★</span>
              <span className="text-muted-foreground">({shop.shopReviewCount} recenzii)</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Utilizatori</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4">Gestionează utilizatorii platformei: vezi, blochează sau promovează utilizatori.</p>
            <Button asChild><Link href="/admin/users">Gestionează utilizatori</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ateliere</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4">Gestionează atelierele: vezi, blochează sau aprobă ateliere.</p>
            <Button asChild><Link href="/admin/shops">Gestionează ateliere</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rapoarte &amp; Moderare</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4">Vezi rapoarte de conținut, moderează anunțuri și gestionează reclamațiile.</p>
            <Button asChild><Link href="/admin/reports">Vezi rapoarte</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
