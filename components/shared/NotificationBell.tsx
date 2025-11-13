"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(collection(db, 'users', user.uid, 'notifications'), where('read', '==', false));
        const snap = await getDocs(q);
        setUnread(snap.size);
      } else {
        setUnread(0);
      }
    });
    return () => unsubscribe();
  }, []);
  return (
    <Link href="/profile/notifications" className="relative group">
      <Bell className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
      {unread > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-bounce z-10">
          {unread}
        </span>
      )}
    </Link>
  );
} 