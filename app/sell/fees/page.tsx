// src/app/sell/fees/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SellerFeesPage() {
  return (
    <PlaceholderContent
      title="Ofrandele pentru Tărâmul ioty"
      description="Aici vei descoperi în curând toate detaliile despre micile ofrande (taxe și comisioane) ce ne ajută să ținem Tărâmul ioty înfloritor și plin de magie pentru toți meșterii. Spiridușii contabili pregătesc pergamentul."
      icon={Coins}
    >
      <Button asChild className="mt-6">
        <Link href="/sell">Înapoi la Poarta Meșterilor</Link>
      </Button>
       <Button asChild variant="outline" className="mt-2">
        <Link href="/">Mergi la Târgul Fermecat</Link>
      </Button>
    </PlaceholderContent>
  );
}
