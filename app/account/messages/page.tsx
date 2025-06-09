// src/app/account/messages/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  senderName: string;
  senderId: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export default function SellerMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const msgQuery = query(
          collection(db, 'users', user.uid, 'messages'),
          orderBy('createdAt', 'desc')
        );
        const msgSnap = await getDocs(msgQuery);
        setMessages(
          msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
        );
      } else {
        setUserId(null);
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!userId) {
    return <PlaceholderContent title="Nu ești autentificat" description="Te rugăm să te autentifici pentru a vedea mesajele tale." icon={Mail} />;
  }

  if (messages.length === 0) {
    return <PlaceholderContent title="Niciun mesaj" description="Nu ai primit încă niciun mesaj. Când vei primi, le vei vedea aici!" icon={Mail} />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Mail className="h-7 w-7 text-primary" /> Mesajele tale</h1>
      {messages.map(msg => (
        <Card key={msg.id} className={`mb-4 ${msg.read ? 'opacity-70' : 'border-primary border-2'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {msg.read ? <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-primary animate-pulse" />}
              {msg.subject}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm mb-2">De la: {msg.senderName}</div>
            <div className="text-muted-foreground text-sm mb-2">{new Date(msg.createdAt).toLocaleString()}</div>
            <div className="mb-4 line-clamp-2">{msg.body}</div>
            {/* TODO: Add button to view full message and mark as read */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
