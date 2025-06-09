// src/app/profile/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Compass } from 'lucide-react'; // Using Compass as a more neutral 'searching' icon
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new /account page
    router.replace('/account');
  }, [router]);

  // Show a message while redirecting or if JS is disabled (though router.replace is client-side)
  return (
    <PlaceholderContent
      title="Redirecționare către Noul Tărâm Personal..."
      description="Colțișorul tău magic s-a mutat! Te trimitem acum către noua pagină de cont, plină de unelte și minunății."
      icon={Compass}
    >
        <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Dacă nu ești redirecționat automat, apasă aici:</p>
            <Button asChild>
                <Link href="/account">Mergi la Contul Meu</Link>
            </Button>
        </div>
    </PlaceholderContent>
  );
}
