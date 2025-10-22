// src/app/signup/page.tsx
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/layout/Logo';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, signInWithPopup, User } from 'firebase/auth';
import { GoogleIcon } from '@/components/shared/GoogleIcon';
import { Separator } from '@/components/ui/separator';

const signupSchema = z.object({
  fullName: z.string().min(3, { message: "Numele de meșter trebuie să aibă măcar 3 slove meșteșugite." }),
  email: z.string().email({ message: "Adresa de email nu pare a fi una din tărâmul digital (validă)." }),
  password: z.string().min(8, { message: "Formula magică (parola) trebuie să aibă cel puțin 8 semne." }),
  confirmPassword: z.string(),
  terms: z.boolean().refine(value => value === true, {
    message: "Trebuie să fii de acord cu legile tărâmului și secretul datelor fermecate."
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Formulele magice (parolele) nu se potrivesc ca două picături de rouă!",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const handleAWeberSubscription = async (user: User, provider?: string) => {
    try {
      const response = await fetch('/api/aweber/subscribe-new-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email || '',
          name: user.displayName || '',
          customFields: {
            'signup_method': provider || 'email',
            'user_id': user.uid,
            'signup_date': new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Successfully subscribed user to newsletter:', result.message);
      } else {
        console.warn('Failed to subscribe user to newsletter:', result.error);
      }
    } catch (error) {
      console.error('Error subscribing user to newsletter:', error);
    }
  };

 const handleAuthSuccess = async (user: User, provider?: string) => {
    // Subscribe user to newsletter
    await handleAWeberSubscription(user, provider);

    const title = provider === 'google' 
      ? "Bun venit în breaslă!" 
      : "Cont făurit! Verifică-ți emailul.";
    
    const description = provider === 'google'
      ? `Salutări, ${user.displayName || 'Meșter Digital'}! Contul tău Google a fost legat de breasla noastră.`
      : `Salut, ${user.displayName}! Ți-am trimis un mesaj de verificare. Te rugăm, **confirmă-ți adresa de email înainte de a te autentifica**. Verifică și căsuța cu spamuri (spam).`;

    toast({
      title: title,
      description: description,
      duration: 10000,
    });
    
    router.push(provider === 'google' ? '/' : '/login'); 
    if (provider === 'google') router.refresh();
  };


  const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Hocus pocus... eroare de sistem!",
        description: "Portalul de autentificare nu este pregătit. Te rugăm, anunță un vrăjitor de sistem!",
      });
      console.error("SIGNUP_PAGE_AUTH_ERROR: Firebase auth object is not available.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.fullName });
      await sendEmailVerification(user);
      handleAuthSuccess(user); 
    } catch (error: any) {
      console.error("Eroare la înregistrare:", error);
      let errorMessage = "A apărut o eroare la crearea contului. Te rugăm, mai încearcă o dată sau cheamă un spiriduș ajutător!";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Această adresă de email este deja folosită de un alt meșter din tărâm. Poate ai uitat parola?";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Formula magică (parola) aleasă este cam simplă. Încearcă una mai puternică!";
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = "Cheia API a tărâmului nu este validă sau lipsește. Anunță un vrăjitor de sistem! Verifică consola browser-ului pentru detalii din 'src/lib/firebase.ts'.";
      } else if (error.code === 'auth/operation-not-allowed') {
         errorMessage = "Crearea de conturi cu email și parolă nu este permisă momentan de Sfatul Bătrânilor. Verifică setările tărâmului sau contactează suportul tehnic.";
      }
      
      toast({
        variant: "destructive",
        title: "Oops! O vrajă greșită în sistem...",
        description: errorMessage,
      });
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth || !googleProvider) {
      toast({
        variant: "destructive",
        title: "Hocus pocus... eroare de sistem!",
        description: "Portalul Google nu e gata de noi meșteri. Anunță un vrăjitor de sistem!",
      });
      console.error("SIGNUP_PAGE_GOOGLE_AUTH_ERROR: Firebase auth or googleProvider object is not available.");
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      handleAuthSuccess(user, 'google');
    } catch (error: any) {
      console.error("Eroare la înregistrarea cu Google:", error);
      let errorMessage = "A apărut o eroare la conectarea cu Google. Mai încearcă o dată!";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Fereastra magică Google s-a închis prea devreme. Mai încearcă dacă dorești!";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Se pare că emailul tău e deja înregistrat, dar cu altă metodă de autentificare (poate cu parola secretă?). Încearcă metoda inițială.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Autentificarea Google nu este activată în setările tărâmului. Anunță un vrăjitor de sistem.";
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-blocked') {
        errorMessage = "Se pare că fereastra magică Google a fost blocată sau închisă. Verifică setările browserului sau încearcă din nou.";
      }
      toast({
        variant: "destructive",
        title: "Conexiune Google întreruptă",
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
          <CardTitle className="text-2xl font-bold tracking-tight text-card-foreground">Bun venit în Tărâmul Meșterilor ioty!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ești deja în breaslă? <Link href="/login" className="font-medium text-primary hover:text-primary/80">Intră în atelier!</Link>
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fullName">Numele tău de meșter faur</FormLabel>
                    <FormControl>
                      <Input id="fullName" placeholder="ex: Ileana Cosânzeana a Lutului" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Adresa ta de email din tărâmul digital</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="mester@taramulfermecat.ro" {...field} />
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
                    <FormLabel htmlFor="password">Formula magică (parolă)</FormLabel>
                    <FormControl>
                      <Input id="password" type="password" placeholder="Alege o formulă puternică" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword">Confirmă formula magică</FormLabel>
                    <FormControl>
                      <Input id="confirmPassword" type="password" placeholder="Scrie din nou formula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background/50">
                     <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="terms"
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel htmlFor="terms" className="font-normal"> 
                            Sunt de acord cu <Link href="/policies/terms-of-service" className="underline hover:text-primary">legile tărâmului</Link> și <Link href="/policies/privacy" className="underline hover:text-primary">secretul datelor fermecate</Link>.
                        </FormLabel>
                        <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Se făurește contul..." : "Alătură-te breslei!"}
              </Button>

              <div className="relative w-full my-2">
                <Separator className="absolute left-0 top-1/2 -translate-y-1/2 w-full" />
                <span className="relative bg-card px-2 text-xs uppercase text-muted-foreground z-10 flex justify-center">
                  <span className="bg-card px-2">Sau alătură-te cu</span>
                </span>
              </div>

              <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignUp}>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Alătură-te cu Google (calea rapidă)
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
