// src/app/profile/orders/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfileOrdersPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new /account page where orders might be displayed
    // For now, let's assume orders are not directly on /account, but a sub-page or within it.
    // This is a placeholder.
    router.replace('/account'); // Or a future specific orders page like /account/my-orders
  }, [router]);

  return (
    <PlaceholderContent
      title="Harta comorilor s-a mutat!"
      description="Acum poți urmări drumul comorilor tale direct din noul tău panou de bord. Te redirecționăm..."
      icon={MapPin}
    >
      <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Dacă nu ești redirecționat automat, apasă aici:</p>
            <Button asChild>
                <Link href="/account">Mergi la contul meu</Link>
            </Button>
        </div>
    </PlaceholderContent>
  );
}
