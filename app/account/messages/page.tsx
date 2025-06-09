// src/app/account/messages/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, setDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  senderName: string;
  senderId: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface Reply {
  id: string;
  body: string;
  createdAt: string;
  sender: string;
}

export default function SellerMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [openMsgId, setOpenMsgId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);

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

  const openMessage = async (msg: Message) => {
    setOpenMsgId(msg.id);
    if (!msg.read && userId) {
      await updateDoc(doc(db, 'users', userId, 'messages', msg.id), { read: true });
      setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
    // Fetch replies
    if (userId) {
      const repliesQuery = query(collection(db, 'users', userId, 'messages', msg.id, 'replies'), orderBy('createdAt', 'asc'));
      const repliesSnap = await getDocs(repliesQuery);
      setReplies(repliesSnap.docs.map(doc => doc.data() as Reply));
    }
  };

  const handleReply = async () => {
    if (!userId || !openMsgId || !reply.trim()) return;
    setReplying(true);
    try {
      const replyId = uuidv4();
      await setDoc(doc(db, 'users', userId, 'messages', openMsgId, 'replies', replyId), {
        id: replyId,
        body: reply,
        createdAt: new Date().toISOString(),
        sender: 'seller',
      });
      setReply('');
      setReplying(false);
      // Refresh replies
      const repliesQuery = query(collection(db, 'users', userId, 'messages', openMsgId, 'replies'), orderBy('createdAt', 'asc'));
      const repliesSnap = await getDocs(repliesQuery);
      setReplies(repliesSnap.docs.map(doc => doc.data() as Reply));
    } catch (e) {
      setReplying(false);
    }
  };

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
        <>
        <Card key={msg.id} className={`mb-4 ${msg.read ? 'opacity-70' : 'border-primary border-2'}`} onClick={() => openMessage(msg)} style={{ cursor: 'pointer' }}>
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
          </CardContent>
        </Card>
        <Dialog open={openMsgId === msg.id} onOpenChange={v => { if (!v) setOpenMsgId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{msg.subject}</DialogTitle>
            </DialogHeader>
            <div className="mb-2 text-muted-foreground text-sm">De la: {msg.senderName}</div>
            <div className="mb-4 whitespace-pre-line">{msg.body}</div>
            {/* Replies list */}
            <div className="mb-4 space-y-2">
              {replies.map(r => (
                <div key={r.id} className={`rounded p-2 ${r.sender === 'seller' ? 'bg-primary/10 text-right' : 'bg-muted'}`}>
                  <div className="text-xs text-muted-foreground mb-1">{r.sender === 'seller' ? 'Tu' : 'Cumpărător'} • {new Date(r.createdAt).toLocaleString()}</div>
                  <div>{r.body}</div>
                </div>
              ))}
            </div>
            <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Răspunde la mesaj..." rows={3} />
            <DialogFooter>
              <Button onClick={handleReply} disabled={replying || !reply.trim()}>{replying ? 'Se trimite...' : 'Trimite răspunsul'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
      ))}
    </div>
  );
}
