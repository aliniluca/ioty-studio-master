
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardDescription, CardFooter
import { DollarSign, Edit3, Package, WandSparkles, Users, Gift } from 'lucide-react'; 
import Image from 'next/image';

const benefits = [
  { icon: Package, title: 'Făuriturile tale călătoresc departe', description: 'Prezintă-ți comorile meșteșugite unei lumi întregi, dornice de frumos și autentic românesc.' },
  { icon: DollarSign, title: 'Recompensă dreaptă, profit maxim pentru harul tău', description: 'Comisioanele sunt transparente (10% din valoarea făuriturii vândute și o mică ofrandă de listare), ca să te bucuri de roadele muncii tale.' },
  { icon: Users, title: 'Construiește-ți nume de meșter vestit', description: 'Creează-ți un profil de meșter iscusit, adună laude și folosește uneltele noastre magice pentru a-ți spori faima.' },
  { icon: Edit3, title: 'Orânduiește-ți atelierul cu ușurință', description: 'Adaugă și actualizează-ți comorile cu poze de basm, povești captivante și detalii despre meșteșugul tău.' },
];

export default function SellPage() {
  return (
    <div className="space-y-12">
      <section className="relative py-16 md:py-24 text-center bg-gradient-to-b from-secondary via-background to-secondary rounded-lg shadow-lg overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <Image 
            src="https://picsum.photos/seed/atelier_mester_banner/1200/600" 
            alt="Fundal cu unelte de meșteșugar și atmosferă de atelier" 
            layout="fill" 
            objectFit="cover"
            className="pointer-events-none"
            data-ai-hint="unelte meșteșugar atelier"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <WandSparkles className="mx-auto h-16 w-16 text-primary mb-6" /> 
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Transformă-ți harul în povești (și recompensă!)
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Alătură-te breslei ioty.ro! Împarte-ți făuriturile create cu pasiune unei lumi dornice de autentic și frumos. Deschide-ți chiar azi atelierul virtual!
          </p>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
            <Link href="/account/create-shop">Făurește primul tău atelier</Link>
          </Button>
           <p className="mt-4 text-sm text-muted-foreground">
            Ești deja în breaslă? <Link href="/sell/dashboard" className="font-medium text-primary hover:text-primary/80">Intră în atelier!</Link>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-foreground text-center mb-12">De ce să-ți aduci făuriturile în târgul nostru?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center bg-card hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <benefit.icon className="mx-auto h-10 w-10 text-accent mb-4" />
                <CardTitle className="text-xl text-card-foreground">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 bg-card rounded-lg shadow-md">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-4">Cum prinde viață magia în târg?</h2>
            <ol className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <WandSparkles className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                <span><strong>1. Făurește-ți profilul de meșter:</strong> înscrie-te în breaslă și împodobește-ți pagina de atelier.</span>
              </li>
              <li className="flex items-start">
                <WandSparkles className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                <span><strong>2. Adaugă-ți minunățiile în târg:</strong> încarcă poze de basm, scrie povești captivante și stabilește prețul fiecărei făurituri. O mică ofrandă se percepe pentru fiecare loc în târg.</span>
              </li>
              <li className="flex items-start">
                <WandSparkles className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                <span><strong>3. Conectează-te cu iubitorii de frumos:</strong> călătorii prin Tărâmul ioty descoperă și îndrăgesc făuriturile tale. Promovează-le pentru a ajunge la cât mai multe inimi!</span>
              </li>
              <li className="flex items-start">
                <WandSparkles className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                <span><strong>4. Trimite povești, primește recompensă:</strong> onorează comenzile cu grijă și primește plata în siguranță prin portalul magic Stripe, minus ofranda de 10% pentru tărâm.</span>
              </li>
            </ol>
             <Button asChild className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup?role=seller">Alătură-te breslei meșterilor</Link>
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden shadow-lg">
            <Image
              src="https://picsum.photos/seed/mester_roman_lucrand/600/400"
              alt="Meșter român lucrând la o creație artizanală"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
              data-ai-hint="meșter artizanat"
            />
          </div>
        </div>
      </section>

      {/* Placeholder for Stripe Integration info */}
      <section className="text-center py-10">
         <Gift className="mx-auto h-10 w-10 text-primary mb-3" />
         <h3 className="text-2xl font-semibold text-foreground mb-3">Tranzacții sigure și line prin portalul Stripe</h3>
         <p className="text-muted-foreground max-w-lg mx-auto">Colaborăm cu Stripe, un portal de încredere, pentru tranzacții sigure și rapide, ca tu să te poți concentra pe făurirea minunățiilor tale.</p>
         {/* Stripe logo could go here */}
      </section>
    </div>
  );
}
