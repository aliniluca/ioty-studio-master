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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    // Fetch all shops
    const shopsSnap = await getDocs(collection(db, 'shops'));
    const shops = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      const term = search.toLowerCase();
      if (shop.name?.toLowerCase().includes(term)) score += 5;
      if (shop.tagline?.toLowerCase().includes(term)) score += 3;
      if (shop.bio?.toLowerCase().includes(term)) score += 2;
      if (shop.policies?.toLowerCase().includes(term)) score += 1;
      if (shop.faq?.toLowerCase().includes(term)) score += 1;
      if (shop.shopReviewCount) score += Math.min(shop.shopReviewCount, 10);
      if (shop.shopRating) score += shop.shopRating * 2;
      return { ...shop, score };
    });
    const ranked = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    // Product search and ranking
    let productScored = products.map(product => {
      let score = 0;
      const term = search.toLowerCase();
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

  return (
    <>
      {/* Advanced Search Filters (only when showAdvanced) */}
      {showAdvanced && (
        <form onSubmit={handleSearch} className="mb-8 max-w-4xl mx-auto">
          <div className="w-full flex flex-wrap gap-2 mt-4">
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
      {!searching && results.length > 0 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Rezultate ateliere</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map(shop => (
              <div key={shop.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">{shop.name}</span>
                  {shop.shopRating && (
                    <span className="flex items-center gap-1 text-yellow-500 font-semibold text-base">
                      {shop.shopRating.toFixed(1)}
                      <Star className="h-4 w-4" />
                      <span className="text-muted-foreground text-xs">({shop.shopReviewCount || 0})</span>
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mb-2">{shop.tagline}</div>
                <div className="mb-2 line-clamp-2">{shop.bio}</div>
                <a href={`/shop/${shop.id}`} className="text-primary underline">Vezi atelierul</a>
              </div>
            ))}
          </div>
        </div>
      )}
      {!searching && productResults.length > 0 && (
        <div className="mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Rezultate produse</h2>
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