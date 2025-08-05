import { Suspense } from 'react';
import ProductDetailClient from './ProductDetailClient';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { PackageSearch } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default function ProductPage({ params }: PageProps) {
  if (typeof params.id !== 'string') {
    return (
      <PlaceholderContent
        title="Eroare: ID produs lipsă"
        description="Nu a fost furnizat un ID valid pentru produs. Încercați să accesați această pagină din lista de produse."
        icon={PackageSearch}
      />
    );
  }

  return (
    <Suspense fallback={<div className="text-center py-10 text-muted-foreground">Se încarcă...</div>}>
      <ProductDetailClient params={{ id: params.id }} />
    </Suspense>
  );
}
