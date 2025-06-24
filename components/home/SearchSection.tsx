"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { ListingCard } from '@/components/shared/ListingCard';
import { navigationCategories } from '@/lib/nav-data';

export function SearchSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [productCategory, setProductCategory] = useState('');
  const [minProductPrice, setMinProductPrice] = useState('');
  const [maxProductPrice, setMaxProductPrice] = useState('');
  const [minProductRating, setMinProductRating] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Show advanced search if ?advanced=1 is present
  useEffect(() => {
    if (searchParams.get('advanced') === '1') {
      setShowAdvanced(true);
    } else {
      setShowAdvanced(false);
    }
  }, [searchParams]);

  // Auto-search when search term is provided in URL
  useEffect(() => {
    const searchTerm = searchParams.get('q');
    if (searchTerm) {
      setSearch(searchTerm);
      // Perform search automatically
      performSearch(searchTerm);
    }
  }, [searchParams]);

  const performSearch = async (searchTerm: string) => {
    setSearching(true);
    console.log('Searching for:', searchTerm);
    
    // Fetch all shops
    const shopsSnap = await getDocs(collection(db, 'shops'));
    const shops = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('All shops fetched:', shops.length);
    console.log('Shop names:', shops.map(s => s.name));
    console.log('Shop IDs:', shops.map(s => s.id));
    
    // Fetch all products
    const productsSnap = await getDocs(collection(db, 'listings'));
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Filter by category, rating, reviews
    const filtered = shops.filter(shop => {
      let ok = true;
      if (category && shop.category !== category) ok = false;
      if (minRating && (!shop.shopRating || shop.shopRating < minRating)) ok = false;
      if (minReviews && (!shop.shopReviewCount || shop.shopReviewCount < minReviews)) ok = false;
      return ok;
    });
    // Compute score for each shop
    const scored = filtered.map(shop => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      if (shop.name?.toLowerCase().includes(term)) score += 5;
      if (shop.tagline?.toLowerCase().includes(term)) score += 3;
      if (shop.bio?.toLowerCase().includes(term)) score += 2;
      if (shop.policies?.toLowerCase().includes(term)) score += 1;
      if (shop.faq?.toLowerCase().includes(term)) score += 1;
      if (shop.shopReviewCount) score += Math.min(shop.shopReviewCount, 10);
      if (shop.shopRating) score += shop.shopRating * 2;
      console.log(`Shop "${shop.name}" score: ${score} (term: "${term}")`);
      return { ...shop, score };
    });
    const ranked = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    console.log('Ranked shops:', ranked.map(s => ({ name: s.name, score: s.score })));
    // Product search and ranking
    let productScored = products.map(product => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      if (product.name?.toLowerCase().includes(term)) score += 5;
      if (product.description?.toLowerCase().includes(term)) score += 3;
      if (product.category?.toLowerCase().includes(term)) score += 2;
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(term))) score += 1;
      if (product.rating) score += product.rating * 2;
      if (product.reviewCount) score += Math.min(product.reviewCount, 10);
      return { ...product, score };
    });
    // Product filters
    productScored = productScored.filter(product => {
      let ok = true;
      if (productCategory && product.category !== productCategory) ok = false;
      if (minProductPrice && Number(product.price) < Number(minProductPrice)) ok = false;
      if (maxProductPrice && Number(product.price) > Number(maxProductPrice)) ok = false;
      if (minProductRating && (!product.rating || product.rating < minProductRating)) ok = false;
      return ok;
    });
    const productRanked = productScored.filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    setProductResults(productRanked);
    setResults(ranked);
    setSearching(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(search);
  };

  return (
    <>
      {/* Advanced Search Filters (only when showAdvanced) */}
      {showAdvanced && (
        <form onSubmit={handleSearch} className="mb-8 max-w-4xl mx-auto">
          <div className="w-full flex flex-wrap gap-2 mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută minunății, meșteri sau povești..."
              className="flex-1 border rounded px-4 py-2"
            />
            <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded px-2 py-2" aria-label="Categorie atelier">
              <option value="">Toate categoriile</option>
              {navigationCategories.map(cat => (
                <option key={cat.slug} value={cat.label}>{cat.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              placeholder="Rating minim atelier"
              className="w-32 border rounded px-2 py-2"
            />
            <input
              type="number"
              min={0}
              value={minReviews}
              onChange={e => setMinReviews(Number(e.target.value))}
              placeholder="Recenzii minime atelier"
              className="w-32 border rounded px-2 py-2"
            />
            <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="border rounded px-2 py-2" aria-label="Categorie produs">
              <option value="">Toate categoriile produse</option>
              {navigationCategories.map(cat => (
                <option key={cat.slug} value={cat.label}>{cat.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={minProductPrice}
              onChange={e => setMinProductPrice(e.target.value)}
              placeholder="Preț minim"
              className="w-28 border rounded px-2 py-2"
            />
            <input
              type="number"
              min={0}
              value={maxProductPrice}
              onChange={e => setMaxProductPrice(e.target.value)}
              placeholder="Preț maxim"
              className="w-28 border rounded px-2 py-2"
            />
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minProductRating}
              onChange={e => setMinProductRating(Number(e.target.value))}
              placeholder="Rating min. produs"
              className="w-32 border rounded px-2 py-2"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Caută</button>
          </div>
        </form>
      )}
      {/* Search Results */}
      {searching && <div className="mb-8 text-center">Se caută...</div>}
      {!searching && (search || searchParams.get('q')) && results.length === 0 && productResults.length === 0 && (
        <div className="mb-8 text-center">
          <p className="text-lg text-muted-foreground">Nu s-au găsit rezultate pentru "{search || searchParams.get('q')}"</p>
          <p className="text-sm text-muted-foreground">Încearcă să cauți cu alți termeni sau explorează categoriile noastre.</p>
        </div>
      )}
      {!searching && results.length > 0 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Rezultate ateliere ({results.length})</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map(shop => (
              <a
                key={shop.id}
                href={`/shop/${shop.id}`}
                className="group block border rounded-xl p-6 bg-card shadow-md hover:shadow-lg transition-all duration-200 hover:bg-primary/5 text-center cursor-pointer h-full"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary bg-muted flex items-center justify-center mb-2">
                    {shop.avatarUrl ? (
                      <img
                        src={shop.avatarUrl}
                        alt={shop.name}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {shop.name?.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-lg text-foreground group-hover:text-primary mb-1 truncate w-full">
                    {shop.name}
                  </div>
                  {shop.tagline && (
                    <div className="text-muted-foreground text-sm mb-2 line-clamp-2">{shop.tagline}</div>
                  )}
                  {shop.bio && !shop.tagline && (
                    <div className="text-muted-foreground text-sm mb-2 line-clamp-2">{shop.bio}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      {!searching && productResults.length > 0 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Rezultate produse ({productResults.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productResults.map(product => (
              <ListingCard key={product.id} listing={product} />
            ))}
          </div>
        </div>
      )}
    </>
  );
} 