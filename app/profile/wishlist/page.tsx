// src/app/profile/wishlist/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfileWishlistPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new /account page where wishlist might be displayed or linked
    router.replace('/account'); // Or a future specific wishlist page like /account/my-wishlist
  }, [router]);

  return (
    <PlaceholderContent
      title="Cufărul cu dorințe și-a schimbat locul!"
      description="Lista ta de dorințe strălucitoare te așteaptă în noul tău panou de bord. Te redirecționăm..."
      icon={Star}
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
