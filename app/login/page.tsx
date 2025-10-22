"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/layout/Logo';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase'; 
import { signInWithEmailAndPassword, sendEmailVerification, signOut, signInWithPopup, User } from 'firebase/auth';
import { subscribeGoogleUser } from '@/lib/aweber';
import { GoogleIcon } from '@/components/shared/GoogleIcon';
import { Separator } from '@/components/ui/separator';


const loginSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu pare a fi una din tărâmul digital (validă)." }),
  password: z.string().min(1, { message: "Formula magică (parola) nu poate fi goală." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAWeberSubscription = async (user: User, provider?: string) => {
    try {
      const result = await subscribeGoogleUser({
        email: user.email || '',
        name: user.displayName || '',
        customFields: {
          'login_method': provider || 'email',
          'user_id': user.uid,
          'login_date': new Date().toISOString()
        }
      });

      if (result.success) {
        console.log('Successfully subscribed user to newsletter:', result.message);
      } else {
        console.warn('Failed to subscribe user to newsletter:', result.message);
      }
    } catch (error) {
      console.error('Error subscribing user to newsletter:', error);
    }
  };

  const handleAuthSuccess = async (user: User, provider?: string) => {
    // Subscribe user to newsletter if they're using Google sign-in
    if (provider === 'google') {
      await handleAWeberSubscription(user, provider);
    }

    const welcomeMessage = provider === 'google' 
      ? `Salutări, ${user.displayName || 'Meșter Digital'}! Ai pășit în tărâm cu Google.`
      : "Bine ai reintrat în Tărâmul ioty!";
    
    toast({
      title: "Bun venit înapoi, meștere!",
      description: welcomeMessage,
    });
    router.push('/');
    router.refresh(); 
  };

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    if (!auth) {
       toast({
        variant: "destructive",
        title: "Hocus pocus... eroare de sistem!",
        description: "Portalul de autentificare nu este pregătit. Te rugăm, anunță un vrăjitor de sistem!",
      });
      console.error("LOGIN_PAGE_AUTH_ERROR: Firebase auth object is not available.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user.emailVerified) {
        handleAuthSuccess(user);
      } else {
        await sendEmailVerification(user);
        toast({
          variant: "destructive",
          title: "Confirmă-ți adresa magică!",
          description: "Se pare că nu ți-ai confirmat încă emailul. Ți-am trimis un nou mesaj de confirmare. Verifică-ți și căsuța cu spamuri (folderul spam)!",
          duration: 10000,
        });
        await signOut(auth); 
      }
    } catch (error: any) {
      console.error("Eroare la autentificare:", error);
      let errorMessage = "A apărut o eroare. Te rugăm, mai încearcă o dată sau cheamă un spiriduș ajutător.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Emailul sau parola secretă nu se potrivesc. Mai încearcă o dată sau poate ai nevoie de un descântec de resetare a parolei?";
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = "Cheia API a tărâmului nu este validă sau lipsește. Anunță un vrăjitor de sistem! Verifică consola browser-ului pentru detalii din 'src/lib/firebase.ts'.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Contul tău a fost suspendat de Sfatul Bătrânilor din tărâm. Contactează-ne pentru ajutor.";
      }
      toast({
        variant: "destructive",
        title: "Oops! O vrajă greșită la autentificare...",
        description: errorMessage,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      toast({
        variant: "destructive",
        title: "Hocus pocus... eroare de sistem!",
        description: "Portalul de autentificare Google nu este pregătit. Anunță un vrăjitor de sistem!",
      });
      console.error("LOGIN_PAGE_GOOGLE_AUTH_ERROR: Firebase auth or googleProvider object is not available.");
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      handleAuthSuccess(user, 'google');
    } catch (error: any) {
      console.error("Eroare la autentificarea cu Google:", error);
      let errorMessage = "A apărut o eroare la intrarea cu Google. Mai încearcă o dată!";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Fereastra magică Google a fost închisă înainte de finalizare. Mai încearcă dacă dorești.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Un cont există deja cu acest email, dar cu altă metodă de logare (poate cu parola secretă?). Încearcă metoda originală.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Autentificarea Google nu este pornită în setările tărâmului. Anunță un vrăjitor de sistem să activeze autentificarea cu Google.";
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
        errorMessage = "Se pare că fereastra magică Google a fost blocată sau închisă de prea multe ori. Verifică setările browserului sau încearcă din nou.";
      }
      toast({
        variant: "destructive",
        title: "Autentificare Google întreruptă",
        description: errorMessage,
      });
    }
  };


  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl bg-card">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-6">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight text-card-foreground">Salutare, meștere! Intră în tărâm!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sau <Link href="/signup" className="font-medium text-primary hover:text-primary/80">alătură-te breslei noastre!</Link>
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Adresa ta de email din tărâmul digital</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" autoComplete="email" required placeholder="mester@taramulfermecat.ro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="password">Formula magică (parola)</FormLabel>
                      <div className="text-sm">
                        <Link href="#" className="font-medium text-primary hover:text-primary/80">
                          Ai uitat formula?
                        </Link>
                      </div>
                    </div>
                    <FormControl>
                      <Input id="password" type="password" autoComplete="current-password" required placeholder="Scrie aici formula magică" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Se deschid porțile fermecate..." : "Pășește în Tărâmul ioty"}
              </Button>

              <div className="relative w-full my-2">
                <Separator className="absolute left-0 top-1/2 -translate-y-1/2 w-full" />
                <span className="relative bg-card px-2 text-xs uppercase text-muted-foreground z-10 flex justify-center">
                  <span className="bg-card px-2">Sau intră cu</span>
                </span>
              </div>

              <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Intră cu Google (calea rapidă)
              </Button>
              
              <p className="text-xs text-center text-muted-foreground pt-4">
                Pășind în tărâm, ești de acord cu <Link href="/policies/terms-of-service" className="underline hover:text-primary">legile tărâmului</Link> și <Link href="/policies/privacy" className="underline hover:text-primary">secretul datelor fermecate</Link>.
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
