import { use } from 'react';
import { ListingCard } from '@/components/shared/ListingCard';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown, Search, WandSparkles } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlaceholderContent } from '@/components/shared/PlaceholderContent';
import { navigationCategories, type NavCategory, type SubCategory } from '@/lib/nav-data';
import type { ProductDetails, Listing } from '@/lib/mock-data-types';
import { productDetailsToListing } from '@/lib/mock-data-types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertTriangle } from 'lucide-react';


const categoryTranslations: Record<string, string> = {
  pottery: "Ceramică Fermecată", 
  textiles: "Textile de Poveste",
  woodcraft: "Lemn Însuflețit",
  jewelry: "Podoabe Strălucitoare",
  ceramics: "Lut Fermecat & Ceramică",
  decorations: "Decorațiuni cu Suflet",
  all: "Toate Minunățiile",
  featured: "Alese de Zânele ioty"
};

function findCategory(slug: string): NavCategory | undefined {
  return navigationCategories.find(cat => cat.slug === slug);
}

function findSubcategory(category: NavCategory, subcategorySlug: string): SubCategory | undefined {
  return category.subcategories?.find(sub => sub.slug === subcategorySlug);
}


export async function generateStaticParams() {
  const params: { categoryId: string; subcategory?: string }[] = [];
  navigationCategories.forEach(cat => {
    params.push({ categoryId: cat.slug });
  });
  params.push({ categoryId: 'all' });
  params.push({ categoryId: 'featured' });
  return params;
}


function getCategoryDisplayName(categoryId: string): string {
  const navCat = findCategory(categoryId);
  if (navCat) return navCat.label;

  if (categoryTranslations[categoryId.toLowerCase()]) {
    return categoryTranslations[categoryId.toLowerCase()];
  }
  const capitalizedId = categoryId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return `Tărâmul ${capitalizedId}`;
}

interface PageProps {
  params: Promise<{ categoryId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  
  const { categoryId } = resolvedParams;
  const searchQuery = resolvedSearchParams?.q as string | undefined;
  const subcategorySlug = resolvedSearchParams?.subcategory as string | undefined;

  const currentCategory = findCategory(categoryId);
  const currentSubcategory = currentCategory && subcategorySlug ? findSubcategory(currentCategory, subcategorySlug) : undefined;

  // Fetch all products from Firestore
  let allProducts: ProductDetails[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'listings'));
    allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductDetails[];
  } catch (e) {
    return (
      <PlaceholderContent
        title="Eroare la încărcarea produselor"
        description="Nu s-au putut încărca făuriturile din tărâm. Încearcă să reîncarci pagina."
        icon={AlertTriangle}
      />
    );
  }

  let filteredProducts: ProductDetails[] = [];

  if (categoryId.toLowerCase() === 'all') {
    filteredProducts = allProducts;
  } else if (categoryId.toLowerCase() === 'featured') {
    filteredProducts = allProducts.filter(p => p.isFeatured);
  } else {
    filteredProducts = allProducts.filter(p => p.categorySlug === categoryId);
  }

  if (currentSubcategory) {
    filteredProducts = filteredProducts.filter(p => p.subcategorySlug === subcategorySlug);
  }

  if (searchQuery) {
    const lowerSearchQuery = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(lowerSearchQuery) ||
      p.description.toLowerCase().includes(lowerSearchQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerSearchQuery)) ||
      p.category.toLowerCase().includes(lowerSearchQuery) ||
      (p.subcategoryName && p.subcategoryName.toLowerCase().includes(lowerSearchQuery))
    );
  }
  
  // Filter by status: only 'approved' or 'pending_approval' for public view
  filteredProducts = filteredProducts.filter(p => p.status === 'approved' || p.status === 'pending_approval');
  
  const listings: Listing[] = filteredProducts.map(productDetailsToListing);


  let pageTitle = getCategoryDisplayName(categoryId);
  if (currentSubcategory) {
    pageTitle = currentSubcategory.name;
    if (currentCategory && categoryId.toLowerCase() !== 'all' && categoryId.toLowerCase() !== 'featured') {
        pageTitle += ` din tărâmul ${currentCategory.label}`;
    }
  } else if (categoryId.toLowerCase() === 'all' || categoryId.toLowerCase() === 'featured') {
     pageTitle = getCategoryDisplayName(categoryId);
  }


  if (searchQuery) {
    let searchContext = "";
    if (currentSubcategory) {
        searchContext = ` în ${currentSubcategory.name}`;
    } else if (currentCategory && categoryId.toLowerCase() !== 'all' && categoryId.toLowerCase() !== 'featured') {
        searchContext = ` în ${currentCategory.label}`;
    }
    pageTitle = `Am căutat "${searchQuery}"${searchContext}`;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">
          {pageTitle} <span className="text-lg text-muted-foreground font-normal">({listings.length} minunății)</span>
        </h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Sortează minunătățile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="mr-2 h-4 w-4" /> Ordonează făuriturile
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Cum ordonăm poveștile?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cele mai iubite</DropdownMenuItem>
              <DropdownMenuItem>Proaspăt făurite</DropdownMenuItem>
              <DropdownMenuItem>Preț: de la pitic la uriaș</DropdownMenuItem>
              <DropdownMenuItem>Preț: de la uriaș la pitic</DropdownMenuItem>
              <DropdownMenuItem>Cele mai lăudate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
         <PlaceholderContent
            title={searchQuery ? `Nicio făuritură găsită pentru "${searchQuery}"` : `Nicio minunăție în ${currentSubcategory ? currentSubcategory.name : getCategoryDisplayName(categoryId)} (deocamdată)`}
            description={searchQuery ? "Poate încerci alți termeni magici sau explorezi alte tărâmuri meșteșugite." : "Dar nu-ți pierde nădejdea! Meșterii adaugă mereu comori noi. Explorează alte tărâmuri sau revino curând!"}
            icon={searchQuery ? WandSparkles : Filter} 
        />
      )}
    </div>
  );
}
