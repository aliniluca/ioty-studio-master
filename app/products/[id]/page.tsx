import ProductDetailClient from './ProductDetailClient';
import { AlertTriangle } from 'lucide-react';
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';

export async function generateStaticParams() {
  // In a real app, this would fetch all product IDs. For mock, it's empty.
  return [];
}

export default function ProductDetailPage({ params }: { params: { id?: string } }) {
  if (typeof params.id !== 'string') {
    return (
      <PlaceholderContent
        title="Eroare: ID produs lipsă"
        description="Nu a fost furnizat un ID valid pentru produs. Încercați să accesați această pagină din lista de produse."
        icon={AlertTriangle}
      />
    );
  }
  return <ProductDetailClient params={{ id: params.id }} />;
}
