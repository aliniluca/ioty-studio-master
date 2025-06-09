
// src/app/maintenance/page.tsx
import { Wrench, Hammer } from 'lucide-react'; // Changed ServerCog to Hammer for craft theme
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Tărâm în Reconstrucție Magică - ioty.ro',
  description: 'Meșterii noștri lucrează cu sârg pentru a face Tărâmul ioty și mai fermecător! Revenim cât ai zice "minunăție"!',
};

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center py-10">
      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-xl bg-card">
        <CardHeader className="items-center">
          <Hammer className="h-16 w-16 sm:h-20 sm:w-20 text-primary mb-6" />
          <CardTitle className="text-2xl sm:text-3xl font-bold text-card-foreground">
            Tărâm în Reconstrucție Magică!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-md sm:text-lg text-muted-foreground">
            Echipa noastră de meșteri și zâne lucrează cu sârg pentru a face Tărâmul ioty și mai fermecător și plin de surprize!
          </p>
          <p className="text-muted-foreground">
            Revenim cât ai zice "minunăție"! Între timp, poți visa la comorile ce vor apărea.
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            Mulțumim pentru înțelegere și răbdare! Echipa ioty.ro, cu drag și spor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
