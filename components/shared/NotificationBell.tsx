"use client";

import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import Link from 'next/link';

// Cache for notification count
const notificationCache = new Map<string, { count: number, timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (uid: string) => {
    // Check cache first
    const cached = notificationCache.get(uid);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setUnread(cached.count);
      return;
    }

    try {
      const q = query(collection(db, 'users', uid, 'notifications'), where('read', '==', false));
      const snap = await getDocs(q);
      const count = snap.size;
      
      // Cache the result
      notificationCache.set(uid, { count, timestamp: Date.now() });
      setUnread(count);
    } catch (error) {
      // Ignore to keep console clean for guests
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchNotifications(user.uid);
        
        // Set up real-time listener for notifications
        const q = query(collection(db, 'users', user.uid, 'notifications'), where('read', '==', false));
        const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          const count = snapshot.size;
          notificationCache.set(user.uid, { count, timestamp: Date.now() });
          setUnread(count);
        }, (error) => {
          // Ignore to keep console clean for guests
        });
        
        return () => {
          unsubscribeNotifications();
        };
      } else {
        setUserId(null);
        setUnread(0);
        notificationCache.clear();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [fetchNotifications]);

  return (
    <Link href="/profile/notifications" className="relative group">
      <Bell className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
      {unread > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-bounce z-10">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
} 