// src/app/admin/page.tsx
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { ShieldCheck, Wand, ListChecks } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="space-y-8">
        <PlaceholderContent
        title="Pupitrul Magic de Control al Tărâmului"
        description="Bine ai venit în inima magiei ioty! De aici, Zânele și Vrăjitorii veghează asupra tărâmului, orânduiesc comorile și se asigură că totul este în armonie."
        icon={Wand} 
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                    <ListChecks className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-xl">Moderarea Minunățiilor</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-4">
                        Privește și orânduiește făuriturile ce așteaptă aprobarea pentru a străluci în târg.
                    </CardDescription>
                    <Button asChild>
                        <Link href="/admin/moderate-listings">Mergi la Panoul de Moderare</Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Placeholder for future admin sections */}
            <Card className="bg-card hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
                <CardHeader>
                    <ShieldCheck className="h-8 w-8 text-muted-foreground mb-2" />
                    <CardTitle className="text-xl">Gestionarea Meșterilor (În curând)</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-4">
                        Administrează conturile meșterilor și atelierele din tărâm.
                    </CardDescription>
                     <Button disabled>Vezi Meșterii</Button>
                </CardContent>
            </Card>
             <Card className="bg-card hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
                <CardHeader>
                    <Wand className="h-8 w-8 text-muted-foreground mb-2" />
                    <CardTitle className="text-xl">Setările Tărâmului (În curând)</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-4">
                        Configurează aspecte generale ale magiei ioty.
                    </CardDescription>
                     <Button disabled>Setări Generale</Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
