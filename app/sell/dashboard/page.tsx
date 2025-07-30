"use client";
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { LayoutDashboard, Store as StoreIcon } from 'lucide-react'; // Renamed Store to StoreIcon to avoid conflict
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, DollarSign, Package, Eye, Star, PlusCircle, List, ShoppingBag, Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { NotificationBell } from '@/components/shared/NotificationBell';

export default function SellerDashboardPage() {
  // Refactor user state to use Firebase Auth (onAuthStateChanged) instead of any mock function.
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch shop info from Firestore
        const shopDocRef = doc(db, 'shops', user.uid);
        const shopDocSnap = await getDoc(shopDocRef);
        if (shopDocSnap.exists()) {
          const shopData = shopDocSnap.data();
          setUser({
            hasShop: true,
            shopId: shopData.id,
            displayName: user.displayName,
            email: user.email,
            // add more fields if needed
          });
        } else {
          setUser({
            hasShop: false,
            shopId: null,
            displayName: user.displayName,
            email: user.email,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !user.hasShop || !user.shopId) {
     return (
      <PlaceholderContent
        title="Opa! Se pare că nu ai un atelier."
        description="Pentru a accesa pupitrul meșterului, trebuie mai întâi să-ți deschizi porțile atelierului tău fermecat în tărâmul ioty."
        icon={StoreIcon}
      >
        <Button asChild className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={user ? "/account/create-shop" : "/login"}>
            {user ? "Deschide un atelier acum" : "Intră în cont / Înscrie-te"}
          </Link>
        </Button>
      </PlaceholderContent>
    );
  }
  const shopId = user.shopId;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Pupitrul meșterului faur
              <span className="ml-2"><NotificationBell /></span>
            </h1>
            <p className="text-muted-foreground">Salutări, meștere iscusit! De aici îți orânduiești atelierul și urmărești cum prind viață minunățiile tale.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/sell/listings/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Făurește o nouă minunăție
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Bani din minunății (luna aceasta)', value: '0.00 RON', icon: DollarSign, change: 'Așteptăm primele comori!', changeType: 'neutral' },
          { title: 'Comori trimise (luna aceasta)', value: '0', icon: Package, change: 'Nicio comandă încă.', changeType: 'neutral' },
          { title: 'Ochi curioși (vizualizări atelier)', value: '0', icon: Eye, change: 'Invită lumea să-ți vadă atelierul!', changeType: 'neutral' },
          { title: 'Stelele atelierului (rating)', value: 'N/A', icon: Star, change: 'Primele povești de la clienți vor apărea aici.', changeType: 'neutral' },
        ].map((stat) => (
          <Card key={stat.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl text-card-foreground">Cum au călătorit comorile (vânzări)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
             <LineChart className="h-24 w-24 text-muted-foreground opacity-50 mb-4" />
             <p className="text-muted-foreground">Harta călătoriilor (grafic vânzări) va apărea aici odată ce primele minunății își găsesc stăpâni.</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl text-card-foreground">Cele mai vâjâitoare minunății (top produse)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
             <BarChart className="h-24 w-24 text-muted-foreground opacity-50 mb-4" />
             <p className="text-muted-foreground">Care dintre făuriturile tale a strălucit cel mai tare? Vei afla aici, după primele vânzări.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card">
          <CardHeader><CardTitle className="text-xl text-card-foreground">Scurtături fermecate</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild><Link href="/sell/listings" className="flex items-center w-full"><List className="mr-2 h-4 w-4" /> Orânduiește minunățiile din atelier</Link></Button>
            <Button variant="outline" className="w-full justify-start" asChild><Link href="/sell/orders" className="flex items-center w-full"><ShoppingBag className="mr-2 h-4 w-4" /> Urmărește drumul comorilor trimise</Link></Button>
            <Button variant="outline" className="w-full justify-start" asChild><Link href={`/shop/${shopId}`} className="flex items-center w-full"><StoreIcon className="mr-2 h-4 w-4" /> Privește-ți atelierul din târg</Link></Button>
            <Button variant="outline" className="w-full justify-start" asChild><Link href="/account/edit-shop" className="flex items-center w-full"><Settings className="mr-2 h-4 w-4" /> Unelte și descântece pentru atelier</Link></Button>
          </CardContent>
        </Card>
         <Card className="bg-card">
          <CardHeader><CardTitle className="text-xl text-card-foreground">Ce s-a mai întâmplat prin târgul fermecat</CardTitle></CardHeader>
          <CardContent className="h-[200px] flex flex-col items-center justify-center text-center">
             <Bell className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
             <p className="text-muted-foreground">Ultimele noutăți din târg, mesaje și comenzi noi, vor apărea aici cât ai zice "meșteșug"...</p>
          </CardContent>
        </Card>
      </div>
       <PlaceholderContent
            title="Globul de cristal (statistici detaliate)"
            description="Mai multe secrete despre cum strălucesc făuriturile tale, inclusiv vizualizări, iubiri primite (favorite), rate de conversie și povești despre clienți, se vor dezvălui aici în curând, după ce atelierul prinde viață."
            icon={LayoutDashboard}
        />
    </div>
  );
}
