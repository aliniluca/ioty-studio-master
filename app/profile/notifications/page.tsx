"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell, CheckCircle2 } from 'lucide-react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/lib/mock-data-types';

export default function ProfileNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const notifQuery = query(
          collection(db, 'users', user.uid, 'notifications'),
          orderBy('createdAt', 'desc')
        );
        const notifSnap = await getDocs(notifQuery);
        setNotifications(
          notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
        );
      } else {
        setUserId(null);
        setNotifications([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const markAsRead = async (notifId: string) => {
    if (!userId) return;
    await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { read: true });
    setNotifications(notifications => notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!userId) {
    return <PlaceholderContent title="Nu ești autentificat" description="Te rugăm să te autentifici pentru a vedea notificările tale." icon={Bell} />;
  }

  if (notifications.length === 0) {
    return <PlaceholderContent title="Nicio notificare" description="Nu ai nicio notificare nouă. Vei primi vești aici când se întâmplă ceva important!" icon={Bell} />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Bell className="h-7 w-7 text-primary" /> Notificările tale</h1>
      {notifications.map(notif => (
        <Card key={notif.id} className={`mb-4 ${notif.read ? 'opacity-70' : 'border-primary border-2'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {notif.read ? <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> : <Bell className="h-5 w-5 text-primary animate-pulse" />}
              {notif.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm mb-2">{new Date(notif.createdAt).toLocaleString()}</div>
            <div className="mb-4">{notif.body}</div>
            {!notif.read && (
              <Button size="sm" variant="outline" onClick={() => markAsRead(notif.id)}>Marchează ca citit</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 