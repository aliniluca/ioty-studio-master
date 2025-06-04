// src/app/sell/how-it-works/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Wand2 } from 'lucide-react'; // Using Wand2 for "how magic works"
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
  return (
    <PlaceholderContent
      title="Cum funcționează magia târgului pentru meșteri"
      description="În curând, vei putea citi aici descântecele și pașii fermecați prin care îți poți aduce minunățiile în Tărâmul ioty și cum ajung ele la iubitorii de frumos. Ghidul meșterului făurar este în pregătire!"
      icon={Wand2}
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
