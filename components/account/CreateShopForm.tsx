// src/components/account/CreateShopForm.tsx
"use client";

import { useState, type FormEvent, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { WandSparkles, UploadCloud, Trash2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase'; 
import { v4 as uuidv4 } from 'uuid';
import { setDoc, doc } from 'firebase/firestore';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function CreateShopForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [shopName, setShopName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>('https://picsum.photos/seed/new_shop_avatar_placeholder/150/150');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>('https://picsum.photos/seed/new_shop_banner_placeholder/1200/300');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Fișier necorespunzător", description: "Te rugăm, alege o imagine." });
        return;
      }
      try {
        const dataUri = await fileToDataUri(file);
        if (type === 'avatar') {
          setAvatarFile(file);
          setAvatarPreview(dataUri);
        } else {
          setBannerFile(file);
          setBannerPreview(dataUri);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Eroare la încărcarea imaginii", description: "Nu am putut citi fișierul." });
      }
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!auth || !auth.currentUser) {
        toast({ 
            variant: "destructive", 
            title: "Autentificare Firebase necesară", 
            description: "Pentru a salva atelierul în baza de date, te rugăm să te autentifici cu un cont Firebase real. Securitatea bazei de date necesită acest lucru." ,
            duration: 7000
        });
        setIsSubmitting(false);
        return;
    }
    
    if (!shopName.trim() || !tagline.trim() || !bio.trim() || !location.trim()) {
      toast({
        variant: "destructive",
        title: "Ceva lipsește din poveste...",
        description: "Te rugăm, completează toate câmpurile pentru a-ți făuri atelierul.",
      });
      setIsSubmitting(false);
      return;
    }

    const newShopId = auth.currentUser.uid; // Only one shop per user
    
    // --- DIAGNOSTIC STEP: Use fixed placeholder URLs for Firestore ---
    const diagnosticAvatarUrl = `https://placehold.co/150x150.png`;
    const diagnosticBannerUrl = `https://placehold.co/1200x300.png`;
    // --- END DIAGNOSTIC STEP ---

    // const finalAvatarUrl = avatarPreview || 'https://picsum.photos/seed/default_shop_avatar/150/150'; // Original line
    // const finalBannerUrl = bannerPreview || 'https://picsum.photos/seed/default_shop_banner/1200/300'; // Original line


    try {
      await setDoc(doc(db, 'shops', newShopId), {
        id: newShopId,
        name: shopName,
        tagline,
        bio,
        location,
        avatarUrl: diagnosticAvatarUrl, // or avatarPreview
        bannerUrl: diagnosticBannerUrl, // or bannerPreview
        dataAiHintAvatar: 'avatar atelier',
        dataAiHintBanner: 'banner atelier',
        userId: auth.currentUser.uid,
        memberSince: new Date().getFullYear().toString(),
        shopRating: 0,
        shopReviewCount: 0,
        productIds: [],
        reviews: [],
        isFeatured: true,
      });

      toast({
        title: "Atelier făurit cu succes!",
        description: `Atelierul "${shopName}" a fost creat.`
      });
      router.push('/account');
      router.refresh();
    } catch (error: any) {
        console.error("Eroare la crearea atelierului:", error);
        toast({
            variant: "destructive",
            title: "O vrajă a eșuat!",
            description: `Nu am putut făuri atelierul: ${error.message || "Eroare necunoscută. Verifică consola browserului pentru detalii."}`
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="shopName" className="text-md font-semibold">Numele atelierului tău magic</Label>
          <Input
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="ex: Prăvălia cu minuni a Zânei"
            required
          />
          <p className="text-xs text-muted-foreground">Alege un nume care să reflecte unicitatea creațiilor tale.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline" className="text-md font-semibold">Sloganul fermecat al atelierului</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="ex: Făurituri cu suflet, pentru inimi de poveste"
            required
          />
           <p className="text-xs text-muted-foreground">O frază scurtă care să descrie esența atelierului tău.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location" className="text-md font-semibold">Unde se află atelierul (localitatea)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex: Sighișoara, Tărâmul legendelor"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-md font-semibold">Povestea atelierului tău</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Spune-ne mai multe despre tine, despre meșteșugul tău, despre inspirația din spatele creațiilor tale..."
            rows={5}
            required
          />
        </div>
        
        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label htmlFor="avatarUpload" className="text-md font-semibold">Chipul atelierului (avatar)</Label>
          <Input 
            id="avatarUpload" 
            type="file" 
            className="sr-only" 
            ref={avatarFileInputRef} 
            accept="image/*" 
            onChange={(e) => handleFileSelect(e, 'avatar')}
            disabled={isSubmitting}
          />
          <Button type="button" variant="outline" onClick={() => avatarFileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
            <UploadCloud className="mr-2 h-4 w-4" /> Încarcă un chip pentru atelier
          </Button>
          {avatarPreview && (
            <div className="mt-2 relative w-36 h-36 rounded-full overflow-hidden border-2 border-muted shadow-sm mx-auto">
              <Image src={avatarPreview} alt="Previzualizare avatar" layout="fill" objectFit="cover" data-ai-hint="avatar previzualizare" />
               <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6 z-10 opacity-80 hover:opacity-100" 
                onClick={() => { setAvatarFile(null); setAvatarPreview('https://picsum.photos/seed/new_shop_avatar_placeholder/150/150'); if(avatarFileInputRef.current) avatarFileInputRef.current.value = ''; }}
                aria-label="Șterge avatar"
                disabled={isSubmitting}
               >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">Un avatar de 150x150px arată cel mai bine.</p>
        </div>

        {/* Banner Upload */}
        <div className="space-y-2">
          <Label htmlFor="bannerUpload" className="text-md font-semibold">Panoramă din atelier (banner)</Label>
          <Input 
            id="bannerUpload" 
            type="file" 
            className="sr-only" 
            ref={bannerFileInputRef} 
            accept="image/*" 
            onChange={(e) => handleFileSelect(e, 'banner')}
            disabled={isSubmitting}
          />
          <Button type="button" variant="outline" onClick={() => bannerFileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
            <UploadCloud className="mr-2 h-4 w-4" /> Încarcă o panoramă pentru atelier
          </Button>
          {bannerPreview && (
            <div className="mt-2 relative w-full aspect-[3/1] rounded-md overflow-hidden border-2 border-muted shadow-sm bg-muted">
              <Image src={bannerPreview} alt="Previzualizare banner" layout="fill" objectFit="cover" data-ai-hint="banner previzualizare" />
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6 z-10 opacity-80 hover:opacity-100" 
                onClick={() => { setBannerFile(null); setBannerPreview('https://picsum.photos/seed/new_shop_banner_placeholder/1200/300'); if(bannerFileInputRef.current) bannerFileInputRef.current.value = '';}}
                aria-label="Șterge banner"
                disabled={isSubmitting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">Un banner de 1200x300px va arăta grozav.</p>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? "Se făurește atelierul..." : <><WandSparkles className="mr-2 h-5 w-5" /> Deschide porțile atelierului!</>}
        </Button>
      </CardFooter>
    </form>
  );
}
    

