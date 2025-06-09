"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { getIdTokenResult } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const tokenResult = await getIdTokenResult(user, true);
        setIsAdmin(!!tokenResult.claims.admin);
        if (!!tokenResult.claims.admin) {
          // Fetch users from Firestore
          const usersSnap = await getDocs(collection(db, 'users'));
          setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } else {
        setIsAdmin(false);
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleBanToggle = async (userId: string, banned: boolean) => {
    setUpdating(userId);
    await updateDoc(doc(db, 'users', userId), { banned: !banned });
    setUsers(users => users.map(u => u.id === userId ? { ...u, banned: !banned } : u));
    setUpdating(null);
  };

  const handlePromoteToggle = async (userId: string, isAdminUser: boolean) => {
    setUpdating(userId);
    await updateDoc(doc(db, 'users', userId), { admin: !isAdminUser });
    setUsers(users => users.map(u => u.id === userId ? { ...u, admin: !isAdminUser } : u));
    setUpdating(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">Se încarcă utilizatorii...</div>;
  }

  if (!isAdmin) {
    return <div className="text-center py-10">Nu ai acces la această zonă.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Gestionare Utilizatori</h1>
      <Card>
        <CardHeader><CardTitle>Utilizatori</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Email</th>
                <th className="py-2">Rol</th>
                <th className="py-2">Status</th>
                <th className="py-2">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.banned ? 'opacity-50' : ''}>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">{user.admin ? 'Admin' : 'User'}</td>
                  <td className="py-2">{user.banned ? 'Blocat' : 'Activ'}</td>
                  <td className="py-2 flex gap-2">
                    <Button size="sm" variant={user.banned ? 'outline' : 'destructive'} disabled={updating === user.id} onClick={() => handleBanToggle(user.id, user.banned)}>
                      {user.banned ? 'Deblochează' : 'Blochează'}
                    </Button>
                    <Button size="sm" variant={user.admin ? 'outline' : 'secondary'} disabled={updating === user.id} onClick={() => handlePromoteToggle(user.id, user.admin)}>
                      {user.admin ? 'Retrogradează' : 'Promovează admin'}
                    </Button>
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