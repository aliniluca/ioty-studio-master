"use client";
import { useState, ChangeEvent, FormEvent, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadCloud, PlusCircle, Trash2, WandSparkles, Sparkles as SparklesIcon } from 'lucide-react'; // Added SparklesIcon
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { navigationCategories } from '@/lib/nav-data';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';

const MAX_IMAGES = 5;

export default function NewListingPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCategoryDetails = navigationCategories.find(cat => cat.slug === selectedCategory);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [shippingPrice, setShippingPrice] = useState('');
  const [shippingTime, setShippingTime] = useState('');
  const [tags, setTags] = useState('');
  const [stock, setStock] = useState('1');
  const [listingFeeAcknowledged, setListingFeeAcknowledged] = useState(false);
  const [advertiseListing, setAdvertiseListing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      const totalFiles = imageFiles.length + newFiles.length;

      if (newFiles.length === 0 && Array.from(files).length > 0) {
        toast({
            variant: "destructive",
            title: "Fișiere nefermecate",
            description: "Se pare că ai ales fișiere care nu sunt poze. Te rugăm, alege imagini de poveste."
        });
      }
      
      if (totalFiles > MAX_IMAGES) {
        toast({
          variant: "destructive",
          title: "Prea multe povești vizuale!",
          description: `Poți urca cel mult ${MAX_IMAGES} poze de basm. Ai selectat ${newFiles.length}, având deja ${imageFiles.length}.`,
        });
        const filesToAdd = newFiles.slice(0, MAX_IMAGES - imageFiles.length);
        if (filesToAdd.length === 0) {
             if(fileInputRef.current) fileInputRef.current.value = ''; 
             return;
        }
         setImageFiles(prev => [...prev, ...filesToAdd]);
         filesToAdd.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

      } else {
        setImageFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
      }
    }
   if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (imageFiles.length === 0) {
      toast({ variant: "destructive", title: "Unde sunt pozele magice?", description: "Orice minunăție are nevoie de măcar o poză de prezentare." });
      return;
    }
    if (imageFiles.length > MAX_IMAGES) {
      toast({ variant: "destructive", title: "Prea multe povești!", description: `Te rugăm, nu mai mult de ${MAX_IMAGES} poze fermecate.` });
      return;
    }
    if (!selectedCategory) {
      toast({ variant: "destructive", title: "Din ce tărâm vine comoara?", description: "Te rugăm, alege un tărâm pentru creația ta." });
      return;
    }
     if (currentCategoryDetails && currentCategoryDetails.subcategories && currentCategoryDetails.subcategories.length > 0 && !selectedSubcategory) {
      toast({ variant: "destructive", title: "Ce fel de minunăție este?", description: "Te rugăm, alege și un colțișor (subcategorie) pentru făuritura ta." });
      return;
    }
    if (!listingFeeAcknowledged) {
      toast({ variant: "destructive", title: "O mică înțelegere magică", description: "Te rugăm să confirmi că ești de acord cu ofranda pentru listare în târg." });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({ variant: "destructive", title: "Trebuie să fii autentificat!", description: "Te rugăm să te autentifici pentru a adăuga o minunăție." });
      return;
    }

    const productImages: ProductImage[] = imagePreviews.map((url, index) => ({
        id: `img_${uuidv4()}_${index}`,
        url: url, // Data URI
        alt: `${title} - imagine ${index + 1}`,
        dataAiHint: 'imagine produs artizanal'
    }));

    const newListingId = `listing_${uuidv4()}`;
    const categoryInfo = navigationCategories.find(c => c.slug === selectedCategory);
    const subcategoryInfo = categoryInfo?.subcategories?.find(s => s.slug === selectedSubcategory);

    const newProductData: ProductDetails = {
      id: newListingId,
      name: title,
      description,
      price: parseFloat(price),
      shippingPrice: parseFloat(shippingPrice) || 0,
      category: categoryInfo?.label || 'Necategorisit',
      categorySlug: selectedCategory,
      subcategoryName: subcategoryInfo?.name,
      subcategorySlug: selectedSubcategory || undefined,
      shippingTime,
      stock: parseInt(stock, 10),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      images: productImages, 
      sellerId: user.uid,
      seller: { id: user.uid, name: user.displayName || user.email || 'User' },
      rating: 0, // New listings start with 0
      reviewCount: 0,
      reviews: [],
      status: 'pending_approval', // Listings need approval
      isFeatured: true, // New listings are featured by default
      advertisement: { isAdvertised: advertiseListing },
      dateAdded: new Date().toISOString(),
    };
    
    try {
      await setDoc(doc(db, 'listings', newListingId), newProductData);
      toast({
        title: "Minunăție trimisă în lume!",
        description: `Făuritura \"${title}\" a pornit spre târgul nostru și așteaptă aprobarea zânelor!`,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setShippingPrice('');
      setShippingTime('');
      setTags('');
      setStock('1');
      setListingFeeAcknowledged(false);
      setAdvertiseListing(false);
      setImagePreviews([]);
      setImageFiles([]);
      setSelectedCategory('');
      setSelectedSubcategory('');
      if (formRef.current) formRef.current.reset();
      
      router.push('/sell/listings');
    } catch (error) {
      toast({ variant: "destructive", title: "Eroare la salvare!", description: "A apărut o problemă la salvarea minunăției. Încearcă din nou." });
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold text-card-foreground flex items-center"><WandSparkles className="mr-3 h-8 w-8 text-primary" /> Făurește o nouă minunăție</CardTitle>
          <CardDescription className="text-muted-foreground">
            Dă viață unei noi creații! Completează cu drag detaliile mai jos. O mică ofrandă se percepe pentru fiecare loc în târgul nostru fermecat. Minunățiile noi vor aștepta aprobarea zânelor înainte de a străluci în văzul tuturor.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} ref={formRef}>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg font-semibold">Numele minunăției tale</Label>
              <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: vază cu povești nemuritoare din lut ars" required />
              <p className="text-xs text-muted-foreground">Un nume fermecător atrage privirile și ajută comorile să fie găsite de călători.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-lg font-semibold">Povestea din spatele creației</Label>
              <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Spune-ne totul: din ce e făcută, ce dimensiuni are, ce secrete ascunde, ce inspirație a stat la bază..." rows={6} required />
            </div>

            <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Cât prețuiești această comoară?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="price">Valoarea minunăției (RON)</Label>
                        <Input id="price" name="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} step="0.01" placeholder="ex: 49.99" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shippingPrice">Prețul călătoriei (RON)</Label>
                        <Input id="shippingPrice" name="shippingPrice" type="number" value={shippingPrice} onChange={(e) => setShippingPrice(e.target.value)} step="0.01" placeholder="ex: 15.00 (lasă 0 dacă e inclus sau gratuit)" />
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="stock" className="text-lg font-semibold">Câte piese ai pe stoc?</Label>
                <Input id="stock" name="stock" type="number" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="ex: 10" required min="0" />
                <p className="text-xs text-muted-foreground">Dacă e o piesă unicat, lasă 1. dacă e stoc epuizat, pune 0.</p>
            </div>


            <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Secretele meșteșugului</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="category">Din ce tărâm provine?</Label>
                        <Select required value={selectedCategory} onValueChange={setSelectedCategory} name="categorySlug">
                            <SelectTrigger id="category">
                            <SelectValue placeholder="Alege un tărâm potrivit" />
                            </SelectTrigger>
                            <SelectContent>
                            {navigationCategories.map(cat => (
                                <SelectItem key={cat.slug} value={cat.slug}>{cat.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {currentCategoryDetails && currentCategoryDetails.subcategories && currentCategoryDetails.subcategories.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="subcategory">Ce fel de minunăție este?</Label>
                            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} name="subcategorySlug" required>
                                <SelectTrigger id="subcategory">
                                <SelectValue placeholder="Alege un colțișor specific" />
                                </SelectTrigger>
                                <SelectContent>
                                {currentCategoryDetails.subcategories.map(sub => (
                                    <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="shippingTime">Cât durează călătoria până la noul stăpân?</Label>
                        <Input id="shippingTime" name="shippingTime" value={shippingTime} onChange={(e) => setShippingTime(e.target.value)} placeholder="ex: 3-5 zile fermecate" required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="tags">Cuvinte magice (etichete, separate prin virgulă)</Label>
                    <Input id="tags" name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: unicat, ceramică pictată, cadou special, basm românesc" />
                    <p className="text-xs text-muted-foreground">Cuvintele magice ajută călătorii să-ți găsească mai ușor comorile în tărâmul ioty.</p>
                </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Imagini de basm (maxim {MAX_IMAGES})</Label>
              <label htmlFor="fileUpload" className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="font-semibold text-foreground">Atinge aici să încarci poze fermecate</p>
                <p className="text-sm text-muted-foreground">Alege până la {MAX_IMAGES} poze de poveste (JPG, PNG). Prima va fi cea principală.</p>
              </label>
              <Input ref={fileInputRef} id="fileUpload" type="file" className="sr-only" multiple accept="image/jpeg,image/png" onChange={handleFileChange} />
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4">
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square border rounded-md overflow-hidden group bg-muted">
                      <Image
                        src={previewUrl}
                        alt={`Poză de basm ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="imagine produs încărcată"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        type="button"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 z-10"
                        onClick={() => handleRemoveImage(index)}
                        aria-label="Fă poza să dispară"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {imagePreviews.length < MAX_IMAGES && (
                    <label htmlFor="fileUpload" className="relative aspect-square border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-primary bg-muted group">
                        <PlusCircle className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                        <span className="sr-only">Mai multe poze de vis</span>
                    </label>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center"><SparklesIcon className="mr-2 h-5 w-5 text-accent" />Promovare magică (publicitate)</h3>
                <div className="items-top flex space-x-2 pt-2">
                    <Checkbox 
                        id="advertiseListing" 
                        name="advertiseListing" 
                        checked={advertiseListing}
                        onCheckedChange={(checked) => setAdvertiseListing(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="advertiseListing" className="text-sm font-medium">
                           Vreau ca această minunăție să strălucească mai tare!
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Bifând aici, făuritura ta va fi pusă în lumina reflectoarelor pe pagina principală și în fruntea tărâmului ei. Detalii despre costurile acestei magii vor fi dezvăluite în curând.
                        </p>
                    </div>
                </div>
            </div>


             <div className="space-y-2">
                <div className="items-top flex space-x-2">
                    <Checkbox 
                        id="listingFeeAcknowledged" 
                        name="listingFeeAcknowledged" 
                        checked={listingFeeAcknowledged}
                        onCheckedChange={(checked) => setListingFeeAcknowledged(checked as boolean)}
                        required 
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="listingFeeAcknowledged" className="text-sm font-medium">
                            Am înțeles că pentru a expune această minunăție în târg se percepe o mică ofrandă de 1 RON (exemplu).
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Această ofrandă ne ajută să ținem târgul magic deschis și plin de minunății. <Link href="/sell/fees" className="underline hover:text-primary">Vezi aici detalii despre ofrande.</Link>
                        </p>
                    </div>
                </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" type="button" asChild>
                <Link href="/sell/dashboard">Lasă pe altădată</Link>
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Trimite minunăția în lumea largă
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
