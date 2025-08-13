"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { NotificationBell } from './NotificationBell';

export function NotificationBellGate() {
	const [uid, setUid] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUid(user?.uid ?? null);
		});
		return () => unsubscribe();
	}, []);

	if (!uid) return null;
	return <NotificationBell />;
}

