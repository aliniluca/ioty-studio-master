// src/components/layout/Header.tsx
"use client";
import Link from 'next/link';
import { Search, ShoppingCart, UserCircle, Menu as MenuIcon, Heart, Settings2, LogOut, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Logo } from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { navigationCategories, type NavCategory } from '@/lib/nav-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useCart } from '@/hooks/use-cart';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

export function Header() {
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasShop, setHasShop] = useState(false);
  const { cartCount, cartItems, loading } = useCart();

  console.log('Header - Cart count:', cartCount, 'Cart items:', cartItems, 'Loading:', loading);

  useEffect(() => {
    console.log('Header: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Header: Auth state changed, user:', user ? user.uid : 'null');
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('Header: User authenticated:', user.uid);
        
        // Check if user has a shop
        try {
          console.log('Header: Checking shop for user ID:', user.uid);
          
          // Use the same logic as AccountDashboard - look for shop document with user UID as document ID
          const shopDoc = await getDoc(doc(db, 'shops', user.uid));
          const hasShopResult = shopDoc.exists();
          
          console.log('Header: Shop exists:', hasShopResult);
          
          setHasShop(hasShopResult);
          
          if (hasShopResult) {
            console.log('Header: User has a shop detected');
            console.log('Header: Shop data:', shopDoc.data());
          } else {
            console.log('Header: No shop found for user');
          }
        } catch (error) {
          console.error('Error checking shop status:', error);
          setHasShop(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setHasShop(false);
        console.log('Header: No user authenticated');
      }
    });

    return () => {
      console.log('Header: Cleaning up auth listener');
      unsubscribe();
    };
  }, [pathname]); // Added pathname to dependency array

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      // Redirect to advanced search with the search term
      router.push(`/?advanced=1&q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setHasShop(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderCategoryDropdownItem = (category: NavCategory) => {
    if (category.subcategories && category.subcategories.length > 0) {
      return (
        <DropdownMenuSub key={category.slug}>
          <DropdownMenuSubTrigger className="text-sm">
            {category.icon && <category.icon className="mr-2 h-4 w-4" />}
            <span>{category.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="max-h-[70vh]">
              <ScrollArea className="h-full">
                <DropdownMenuItem asChild className="text-sm">
                  <Link href={category.href}>Vezi tot tărâmul "{category.label}"</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {category.subcategories.map((sub) => (
                  <DropdownMenuItem key={sub.slug} asChild className="text-sm">
                    <Link href={sub.href}>{sub.name}</Link>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      );
    }
    return (
      <DropdownMenuItem key={category.slug} asChild className="text-sm">
        <Link href={category.href}>
          {category.icon && <category.icon className="mr-2 h-4 w-4" />}
          {category.label}
        </Link>
      </DropdownMenuItem>
    );
  };

  const renderMobileCategoryLink = (category: NavCategory, closeSheet: () => void) => {
    return (
      <Button
        key={category.slug}
        variant="ghost"
        onClick={() => { router.push(category.href); closeSheet(); }}
        className="text-base font-medium text-foreground hover:text-primary whitespace-normal text-left h-auto py-3 justify-start"
      >
        {category.icon && <category.icon className="mr-3 h-5 w-5" />}
        {category.label}
      </Button>
    );
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="Pagina principală ioty.ro">
              <Logo />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-foreground hover:text-primary hover:bg-accent/50 px-3 py-2 hidden md:flex">
                  <MenuIcon className="mr-2 h-5 w-5" /> Categorii
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="start">
                <DropdownMenuLabel className="text-base">Explorează tărâmurile meșteșugite</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[60vh] max-h-[calc(100vh-10rem)]">
                  {navigationCategories.map((category) => renderCategoryDropdownItem(category))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-grow flex justify-center px-4 md:px-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl flex items-center gap-2">
              <Input
                type="search"
                placeholder="Caută minunății, meșteri sau povești..."
                className="h-10 w-full rounded-full pl-10 pr-12 text-base border-border focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
                <span className="sr-only">Caută</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                aria-label="Căutare avansată"
                onClick={() => router.push(`/?advanced=1`)}
              >
                <Settings2 className="h-5 w-5 text-primary" />
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
             {!isAuthenticated && (
                <Button variant="outline" asChild className="px-3 py-2 text-sm font-medium hidden md:inline-flex hover:bg-accent/50 border-primary text-primary hover:text-accent-foreground">
                    <Link href="/sell">Vinde pe ioty</Link>
                </Button>
             )}
            {isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <UserCircle className="h-6 w-6" />
                    <span className="sr-only">Colțul meu fermecat</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="text-base">Salut, {currentUser.displayName || 'Meșter'}!</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-sm"><Link href="/account">Panoul meu de bord</Link></DropdownMenuItem>
                  {hasShop && (
                    <>
                       <DropdownMenuItem asChild className="text-sm"><Link href="/sell/dashboard">Pupitrul meșterului</Link></DropdownMenuItem>
                       <DropdownMenuItem asChild className="text-sm"><Link href="/sell/listings">Minunățiile mele</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild className="text-sm"><Link href="/profile/wishlist">Favoritele mele</Link></DropdownMenuItem>
                  {hasShop && (
                    <DropdownMenuItem asChild className="text-sm"><Link href="/profile/my-shop">Atelierul meu</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-sm text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                      <LogOut className="mr-2 h-4 w-4" /> Ieși din tărâmul magic
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" asChild className="px-3 py-2 text-sm font-medium hidden md:inline-flex hover:bg-accent/50">
                  <Link href="/login">Intră / Înscrie-te</Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/profile/wishlist">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Favorite</span>
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild className="rounded-full relative">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
                <span className="sr-only">Coșulețul cu dorințe</span>
              </Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Deschide meniul</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] pt-10 flex flex-col bg-background">
                <ScrollArea className="flex-grow">
                  <nav className="flex flex-col space-y-1 pr-4">
                    <SheetClose asChild>
                       <Link href="/" className="mb-6 self-start">
                         <Logo />
                       </Link>
                    </SheetClose>

                    {isAuthenticated && currentUser ? (
                        <>
                         <SheetClose asChild>
                            <Button variant="ghost" asChild className="text-base font-medium text-foreground hover:text-primary justify-start w-full py-3">
                                <Link href="/account" className="flex items-center"> <Settings2 className="mr-3 h-5 w-5" /> Panoul meu</Link>
                            </Button>
                         </SheetClose>
                          {hasShop && (
                            <>
                             <SheetClose asChild>
                                <Button variant="ghost" asChild className="text-base font-medium text-foreground hover:text-primary justify-start w-full py-3">
                                    <Link href="/sell/dashboard">Pupitrul meșterului</Link>
                                </Button>
                             </SheetClose>
                             <SheetClose asChild>
                                <Button variant="ghost" asChild className="text-base font-medium text-foreground hover:text-primary justify-start pl-10 w-full py-3">
                                    <Link href="/sell/listings">Minunățiile mele</Link>
                                </Button>
                             </SheetClose>
                            </>
                          )}
                           <SheetClose asChild>
                            <Button variant="ghost" asChild className="text-base font-medium text-foreground hover:text-primary justify-start w-full py-3">
                                <Link href="/profile/wishlist" className="flex items-center"> <Heart className="mr-3 h-5 w-5" /> Favoritele mele</Link>
                            </Button>
                         </SheetClose>
                          {hasShop && (
                            <SheetClose asChild>
                                <Button variant="ghost" asChild className="text-base font-medium text-foreground hover:text-primary justify-start w-full py-3">
                                    <Link href="/profile/my-shop" className="flex items-center"> <Store className="mr-3 h-5 w-5" /> Atelierul meu</Link>
                                </Button>
                            </SheetClose>
                          )}
                          <SheetClose asChild>
                            <Button
                                variant="ghost"
                                onClick={() => { handleLogout(); const sheetCloseButton = document.querySelector('[data-radix-dialog-default-open="false"]'); if (sheetCloseButton instanceof HTMLElement) sheetCloseButton.click(); }}
                                className="text-base font-medium text-destructive hover:text-destructive/80 justify-start w-full py-3 cursor-pointer"
                            >
                                <LogOut className="mr-3 h-5 w-5" /> Ieși din tărâmul magic
                            </Button>
                          </SheetClose>
                        </>
                    ) : (
                      <>
                        <SheetClose asChild>
                            <Button asChild className="w-full bg-primary text-primary-foreground mt-4 text-base py-3">
                                <Link href="/login">Intră / Înscrie-te</Link>
                            </Button>
                        </SheetClose>
                         <SheetClose asChild>
                            <Button variant="outline" asChild className="w-full mt-2 text-base py-3 border-primary text-primary">
                                <Link href="/sell">Vinde pe ioty</Link>
                            </Button>
                        </SheetClose>
                      </>
                    )}
                    <DropdownMenuSeparator className="my-4"/>
                    <p className="text-sm font-semibold text-muted-foreground px-2 pt-2">Categorii de minunății</p>
                    {navigationCategories.map((category) => (
                      <SheetClose asChild key={category.slug}>{(sheetContext: { close: () => void; }) => renderMobileCategoryLink(category, sheetContext.close)}</SheetClose>
                    ))}
                  </nav>
                </ScrollArea>
                 <div className="mt-auto border-t pt-4">
                    <SheetClose asChild>
                         <Button variant="link" asChild className="text-sm text-muted-foreground justify-start w-full">
                            <Link href="/blog">Cronicile ioty</Link>
                        </Button>
                    </SheetClose>
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
