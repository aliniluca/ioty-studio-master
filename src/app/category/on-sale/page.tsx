// src/app/category/on-sale/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { PercentSquare } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnSalePage() {
  return (
    <PlaceholderContent
      title="Podoabe la prețuri fermecate"
      description="Meșterii darnici din Tărâmul ioty au pregătit oferte speciale! În curând, vei găsi aici comori la prețuri și mai prietenoase, gata să-ți încânte sufletul. Zânele negociază ultimele detalii!"
      icon={PercentSquare}
    >
      <Button asChild className="mt-6">
        <Link href="/">Explorează alte tărâmuri</Link>
      </Button>
       <Button asChild variant="outline" className="mt-2">
        <Link href="/category/all">Vezi toate minunățiile</Link>
      </Button>
    </PlaceholderContent>
  );
}
