// src/app/sell/orders/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SellerOrdersPage() {
  return (
    <PlaceholderContent
      title="Drumul comorilor trimise"
      description="Aici vei putea urmări toate comenzile primite pentru minunățiile tale, de la momentul magic al plasării comenzii până la zborul lin către noul stăpân. Spiridușii logistici încă pregătesc hărțile!"
      icon={PackageCheck}
    >
        <Button asChild className="mt-6">
            <Link href="/sell/dashboard">Înapoi la pupitrul meșterului</Link>
        </Button>
    </PlaceholderContent>
  );
}
