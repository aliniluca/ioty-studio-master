// src/components/account/AccountDashboard.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, PlusCircle, Edit3, LayoutDashboard, MessageSquare, UserCog, Settings, LogOut, ShoppingBag, Heart, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation'; // For logout

interface AccountDashboardProps {
  user: UserAccount;
}

export function AccountDashboard({ user }: AccountDashboardProps) {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you would also call Firebase signOut:
    // import { auth } from '@/lib/firebase';
    // import { signOut } from 'firebase/auth';
    // signOut(auth).then(() => router.push('/')).catch(err => console.error(err));
    router.push('/');
    router.refresh(); // Important to update header state
  };


  return (
    <div className="space-y-8">
      <Card className="bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">Salutări, {user.displayName}!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Bine ai revenit în colțișorul tău fermecat din Tărâmul ioty. De aici poți orândui toate cele.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Account Management */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-xl"><UserCog className="mr-2 h-5 w-5 text-primary" />Profilul tău magic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/edit-profile"><Settings className="mr-2 h-4 w-4"/>Șlefuiește detaliile contului</Link>
            </Button>
            <p className="text-xs text-muted-foreground">Modifică-ți numele, emailul sau parola secretă.</p>
          </CardContent>
        </Card>

        {/* Orders & Wishlist (for buyers) */}
         <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-xl"><ShoppingBag className="mr-2 h-5 w-5 text-primary" />Comorile tale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile/orders"><MapPin className="mr-2 h-4 w-4"/>Unde-s comorile comandate?</Link>
            </Button>
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile/wishlist"><Heart className="mr-2 h-4 w-4"/>Cufărul cu dorințe strălucitoare</Link>
            </Button>
            <p className="text-xs text-muted-foreground">Vezi ce ai comandat sau ce ai pus la inimă.</p>
          </CardContent>
        </Card>


        {/* Seller Section - Conditional */}
        {user.hasShop && user.shopId ? (
          <Card className="bg-card lg:col-span-1 md:col-span-2"> {/* Adjusted span for better layout */}
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Store className="mr-2 h-5 w-5 text-primary" />Atelierul tău: {user.shopName || 'Fără Nume'}</CardTitle>
              <CardDescription>Unelte și descântece pentru a-ți gestiona prăvălia fermecată.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="default" className="w-full justify-start bg-primary hover:bg-primary/90" asChild>
                <Link href="/sell/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Pupitrul meșterului</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/sell/listings"><PlusCircle className="mr-2 h-4 w-4" /> Orânduiește minunățiile</Link>
              </Button>
               <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/sell/listings/new"><PlusCircle className="mr-2 h-4 w-4" /> Făurește o nouă comoară</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/account/edit-shop`}><Edit3 className="mr-2 h-4 w-4" /> Șlefuiește detaliile atelierului</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/messages"><MessageSquare className="mr-2 h-4 w-4" /> Vorbe de la călători</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-accent/20 border-accent md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-accent-foreground"><Store className="mr-2 h-5 w-5 text-accent" /> Ești meșter faur?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Nu ai încă un atelier deschis în Tărâmul ioty. E timpul să-ți aduci minunățiile la lumină!
              </p>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/account/create-shop">
                  <PlusCircle className="mr-2 h-5 w-5" /> Deschide-ți atelierul fermecat
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="mt-10 text-center">
         <Button 
            variant="ghost" 
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Ieși din tărâmul magic (deconectare)
        </Button>
      </div>
    </div>
  );
}
