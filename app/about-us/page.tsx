// src/app/about-us/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { BookHeart } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutUsPage() {
  return (
    <PlaceholderContent
      title="Povestea Tărâmului ioty"
      description="Fiecare tărâm magic are o poveste. A noastră este încă în curs de scriere, țesută cu fire de pasiune pentru meșteșug și inovație. În curând, vei putea citi aici despre cum a luat naștere ioty.ro și despre visul nostru de a uni artizanii și iubitorii de frumos."
      icon={BookHeart}
    >
      <Button asChild className="mt-6">
        <Link href="/">Înapoi la Târgul Fermecat</Link>
      </Button>
    </PlaceholderContent>
  );
}
