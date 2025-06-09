// src/components/account/EditShopForm.tsx
"use client";

import { useState, useEffect, type FormEvent, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ShopDetails } from '@/lib/mock-data-types';
import { Save, UploadCloud, Trash2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface EditShopFormProps {
  // currentShopData is now fetched inside based on shopId if available
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function EditShopForm({}: EditShopFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [currentShopData, setCurrentShopData] = useState<ShopDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [shopName, setShopName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [policies, setPolicies] = useState<string>('');
  const [faq, setFaq] = useState<string>('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchShop() {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }
      const shopDoc = await getDoc(doc(db, 'shops', auth.currentUser.uid));
      if (shopDoc.exists()) {
        const data = shopDoc.data() as ShopDetails;
        setCurrentShopData(data);
        setShopName(data.name);
        setTagline(data.tagline);
        setBio(data.bio);
        setLocation(data.location);
        setAvatarPreview(data.avatarUrl);
        setBannerPreview(data.bannerUrl);
        setPolicies(data.policies || '');
        setFaq(data.faq || '');
      }
      setIsLoading(false);
    }
    fetchShop();
  }, []);

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

    if (!currentShopData) {
      toast({ variant: "destructive", title: "Eroare de meșter", description: "Detaliile atelierului nu au putut fi încărcate pentru modificare." });
      return;
    }
    if (!shopName.trim() || !tagline.trim() || !bio.trim() || !location.trim()) {
      toast({
        variant: "destructive",
        title: "Ceva lipsește din poveste...",
        description: "Te rugăm, completează toate câmpurile esențiale pentru a-ți șlefui atelierul.",
      });
      return;
    }
    
    const finalAvatarUrl = avatarFile && avatarPreview ? avatarPreview : currentShopData.avatarUrl;
    const finalBannerUrl = bannerFile && bannerPreview ? bannerPreview : currentShopData.bannerUrl;

    toast({
      title: "Atelier șlefuit cu meșteșug!",
      description: `Detaliile atelierului "${shopName}" au fost actualizate cu succes! (Simulare)`,
    });

    await setDoc(doc(db, 'shops', auth.currentUser.uid), {
      name: shopName,
      tagline,
      bio,
      location,
      avatarUrl: finalAvatarUrl,
      bannerUrl: finalBannerUrl,
      policies,
      faq,
    }, { merge: true });

    router.push('/account');
    router.refresh();
  };

  if (isLoading) {
     return <CardContent><p className="text-muted-foreground text-center py-8">Se încarcă uneltele de șlefuit...</p></CardContent>;
  }

  if (!currentShopData) {
    return (
      <CardContent>
        <p className="text-muted-foreground text-center py-8">Detaliile atelierului nu au putut fi încărcate sau atelierul nu există. Te rugăm să încerci din nou sau să contactezi spiridușii ajutători.</p>
      </CardContent>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="shopName" className="text-md font-semibold">Numele atelierului tău magic</Label>
          <Input
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline" className="text-md font-semibold">Sloganul fermecat al atelierului</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location" className="text-md font-semibold">Unde se află atelierul (localitatea)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-md font-semibold">Povestea atelierului tău</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            required
          />
        </div>
        
        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label htmlFor="avatarUploadEdit" className="text-md font-semibold">Chipul atelierului (avatar)</Label>
          <Input 
            id="avatarUploadEdit" 
            type="file" 
            className="sr-only" 
            ref={avatarFileInputRef} 
            accept="image/*" 
            onChange={(e) => handleFileSelect(e, 'avatar')}
          />
          <Button type="button" variant="outline" onClick={() => avatarFileInputRef.current?.click()} className="w-full">
            <UploadCloud className="mr-2 h-4 w-4" /> Schimbă chipul atelierului
          </Button>
          {avatarPreview && (
            <div className="mt-2 relative w-36 h-36 rounded-full overflow-hidden border-2 border-muted shadow-sm mx-auto">
              <Image src={avatarPreview} alt="Previzualizare avatar" layout="fill" objectFit="cover" data-ai-hint="avatar previzualizare"/>
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6 z-10 opacity-80 hover:opacity-100" 
                onClick={() => { setAvatarFile(null); setAvatarPreview('https://picsum.photos/seed/default_avatar_placeholder/150/150'); if(avatarFileInputRef.current) avatarFileInputRef.current.value = ''; }}
                aria-label="Șterge avatar"
               >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
           <p className="text-xs text-muted-foreground text-center">Un avatar de 150x150px arată cel mai bine.</p>
        </div>

        {/* Banner Upload */}
        <div className="space-y-2">
          <Label htmlFor="bannerUploadEdit" className="text-md font-semibold">Panoramă din atelier (banner)</Label>
          <Input 
            id="bannerUploadEdit" 
            type="file" 
            className="sr-only" 
            ref={bannerFileInputRef} 
            accept="image/*" 
            onChange={(e) => handleFileSelect(e, 'banner')}
          />
          <Button type="button" variant="outline" onClick={() => bannerFileInputRef.current?.click()} className="w-full">
            <UploadCloud className="mr-2 h-4 w-4" /> Schimbă panorama atelierului
          </Button>
          {bannerPreview && (
            <div className="mt-2 relative w-full aspect-[3/1] rounded-md overflow-hidden border-2 border-muted shadow-sm bg-muted">
              <Image src={bannerPreview} alt="Previzualizare banner" layout="fill" objectFit="cover" data-ai-hint="banner previzualizare"/>
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-1 right-1 h-6 w-6 z-10 opacity-80 hover:opacity-100" 
                onClick={() => { setBannerFile(null); setBannerPreview('https://picsum.photos/seed/default_banner_placeholder/1200/300'); if(bannerFileInputRef.current) bannerFileInputRef.current.value = ''; }}
                aria-label="Șterge banner"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">Un banner de 1200x300px va arăta grozav.</p>
        </div>

        <div className="mb-4">
          <Label htmlFor="policies">Politici ale atelierului</Label>
          <Textarea id="policies" value={policies} onChange={e => setPolicies(e.target.value)} placeholder="Ex: Politica de retur, livrare, garanție..." rows={4} />
        </div>
        <div className="mb-4">
          <Label htmlFor="faq">Întrebări frecvente (FAQ)</Label>
          <Textarea id="faq" value={faq} onChange={e => setFaq(e.target.value)} placeholder="Ex: Cum pot personaliza o comandă? Cât durează livrarea?..." rows={4} />
        </div>

      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Save className="mr-2 h-5 w-5" /> Păstrează modificările magice
        </Button>
      </CardFooter>
    </form>
  );
}
