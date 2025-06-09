// src/app/category/new-arrivals/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { Sparkles } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewArrivalsPage() {
  return (
    <PlaceholderContent
      title="Proaspăt făurite în ateliere"
      description="Spiridușii tocmai au adus cele mai noi minunății din atelierele meșterilor! Acest colț al Tărâmului ioty va străluci în curând cu cele mai recente creații. Fii cu ochii pe el!"
      icon={Sparkles}
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
