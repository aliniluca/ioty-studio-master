"use client";
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Removed: import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, WandSparkles } from 'lucide-react'; // Removed X
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(items);
    }
  }, []);

  const updateCart = (items) => {
    setCartItems(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  };

  const handleQuantity = (id, delta) => {
    const items = cartItems.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
    updateCart(items);
  };

  const handleRemove = (id) => {
    const items = cartItems.filter(item => item.id !== id);
    updateCart(items);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingEstimate = cartItems.length > 0 ? 15.00 : 0; 
  const taxEstimate = subtotal * 0.08; 
  const total = subtotal + shippingEstimate + taxEstimate;

  // Handler for Stripe checkout
  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Call the API route to create a Stripe Checkout session
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert('A apărut o problemă la inițierea plății.');
      }
    } catch (error) {
      alert('Eroare la inițierea plății.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Coșulețul tău cu minunății</h1>

      {cartItems.length === 0 ? (
        <Card className="text-center py-12 bg-card">
            <CardContent>
                <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-card-foreground mb-2">Hmm, coșulețul tău e cam golaș...</h2>
                <p className="text-muted-foreground mb-6">Nicio grijă, comorile te așteaptă să le descoperi în Tărâmul ioty!</p>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/">Hai la vânătoare de făurituri!</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <Card key={item.id} className="flex items-start p-4 gap-4 bg-card overflow-hidden">
                <div className="relative w-24 h-24 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={item.dataAiHint || 'produs din coș'}
                  />
                </div>
                <div className="flex-grow">
                  <Link href={`/products/${item.productId}`} className="font-semibold text-card-foreground hover:text-primary text-lg">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">Făurit de: {item.seller}</p>
                  <p className="text-md font-semibold text-accent mt-1">{item.price.toFixed(2)} RON</p>
                  <div className="flex items-center mt-3">
                    <p className="text-sm font-medium mr-2">Câte bucăți de magie?</p>
                    <div className="flex items-center border rounded-md h-9">
                        <Button variant="ghost" size="icon" className="h-full w-9 text-muted-foreground hover:text-foreground" onClick={() => handleQuantity(item.id, -1)}><Minus className="h-4 w-4"/></Button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-full w-9 text-muted-foreground hover:text-foreground" onClick={() => handleQuantity(item.id, 1)}><Plus className="h-4 w-4"/></Button>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleRemove(item.id)}>
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Zboară, minunăție!</span>
                </Button>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Ce-avem bun în coșuleț?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-card-foreground">
                  <span>Subtotal făurituri</span>
                  <span>{subtotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Drumul comorilor (estimare)</span>
                  <span>{shippingEstimate.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Contribuția la magie (TVA estimat)</span>
                  <span>{taxEstimate.toFixed(2)} RON</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total de plătit cu zâmbet</span>
                  <span>{total.toFixed(2)} RON</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-3">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCheckout} disabled={loading}>
                  <WandSparkles className="mr-2 h-5 w-5" /> {loading ? 'Se redirecționează...' : 'Spre casa de marcat fermecată!'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Drumul și taxele se dezvăluie la finalul descântecului. Plata se face printr-un portal magic (Stripe).
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
