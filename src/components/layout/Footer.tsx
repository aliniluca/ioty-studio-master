
import Link from 'next/link';
import { Logo } from './Logo';
import { BookOpenText, Sparkles, Compass, ShieldCheck } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="mb-4 inline-block">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">
              Un tărâm unde harul meșterilor întâlnește magia creației, adus la viață de artizani vizionari.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-foreground flex items-center"><Compass className="mr-2 h-5 w-5 text-primary" />Pentru Călătorii prin Tărâm</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/all" className="text-muted-foreground hover:text-primary">Toate Minunățiile</Link></li>
              <li><Link href="/category/featured" className="text-muted-foreground hover:text-primary">Comori Alese de Zâne</Link></li>
              <li><Link href="/category/new-arrivals" className="text-muted-foreground hover:text-primary">Proaspăt Făurite în Ateliere</Link></li>
              <li><Link href="/category/on-sale" className="text-muted-foreground hover:text-primary">Podoabe la Prețuri Fermecate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-foreground flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" />Pentru Meșterii Fauri</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sell" className="text-muted-foreground hover:text-primary">Adu-ți Făuriturile în Târg</Link></li>
              <li><Link href="/sell/dashboard" className="text-muted-foreground hover:text-primary">Pupitrul Tău de Meșter</Link></li>
              <li><Link href="/sell/how-it-works" className="text-muted-foreground hover:text-primary">Cum Funcționează Magia Târgului</Link></li>
              <li><Link href="/sell/fees" className="text-muted-foreground hover:text-primary">Ofrandele Tărâmului</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-foreground flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary" />Despre Tărâmul ioty</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about-us" className="text-muted-foreground hover:text-primary">Povestea ioty.ro</Link></li>
               <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary flex items-center">
                  <BookOpenText className="mr-1.5 h-4 w-4" /> Cronicile ioty
                </Link>
              </li>
              <li><Link href="/policies/terms-of-service" className="text-muted-foreground hover:text-primary">Legile Magice ale Tărâmului</Link></li>
              <li><Link href="/policies/privacy" className="text-muted-foreground hover:text-primary">Secretul Datelor Fermecate</Link></li>
              <li><Link href="/support" className="text-muted-foreground hover:text-primary">Sprijin de la Spiriduși</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} ioty.ro. Toate minunățiile sunt protejate de farmece și descântece. </p>
          <p className="mt-1">Un tărâm creat de meșteri digitali, pentru meșteri făurari (și iubitorii de frumos cu suflet de copil!).</p>
        </div>
      </div>
    </footer>
  );
}

    