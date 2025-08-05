"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAfter } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { ListingCard } from '@/components/shared/ListingCard';
import { navigationCategories } from '@/lib/nav-data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Cache for search results
const searchCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Debounce search term
  const debouncedSearch = useDebounce(search, 500);

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
    }
  }, [searchParams]);

  // Perform search when debounced search changes
  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    } else {
      setResults([]);
      setProductResults([]);
    }
  }, [debouncedSearch]);

  const performSearch = useCallback(async (searchTerm: string, isLoadMore = false) => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    console.log('Searching for:', searchTerm);
    
    // Check cache first
    const cacheKey = `${searchTerm}-${category}-${minRating}-${minReviews}-${productCategory}-${minProductPrice}-${maxProductPrice}-${minProductRating}-${page}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !isLoadMore) {
      console.log('Using cached search results');
      setResults(cached.data.filter(item => item.type === 'shop'));
      setProductResults(cached.data.filter(item => item.type === 'product'));
      setSearching(false);
      return;
    }

    try {
      // Build optimized queries
      const shopQuery = buildShopQuery(searchTerm, category, minRating, minReviews);
      const productQuery = buildProductQuery(searchTerm, productCategory, minProductPrice, maxProductPrice, minProductRating);

      // Execute queries in parallel
      const [shopsSnap, productsSnap] = await Promise.all([
        getDocs(shopQuery),
        getDocs(productQuery)
      ]);

      const shops = shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'shop' }));
      const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'product' }));

      // Score and rank results
      const scoredShops = scoreShops(shops, searchTerm);
      const scoredProducts = scoreProducts(products, searchTerm);

      const allResults = [...scoredShops, ...scoredProducts];
      
      // Cache results
      searchCache.set(cacheKey, { data: allResults, timestamp: Date.now() });

      if (isLoadMore) {
        setResults(prev => [...prev, ...scoredShops]);
        setProductResults(prev => [...prev, ...scoredProducts]);
      } else {
        setResults(scoredShops);
        setProductResults(scoredProducts);
      }

      setLastDoc(productsSnap.docs[productsSnap.docs.length - 1]);
      setHasMore(productsSnap.docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, [category, minRating, minReviews, productCategory, minProductPrice, maxProductPrice, minProductRating, page]);

  const buildShopQuery = (searchTerm: string, category: string, minRating: number, minReviews: number) => {
    let q = query(collection(db, 'shops'), limit(ITEMS_PER_PAGE));
    
    const conditions = [];
    if (category) conditions.push(where('category', '==', category));
    if (minRating > 0) conditions.push(where('shopRating', '>=', minRating));
    if (minReviews > 0) conditions.push(where('shopReviewCount', '>=', minReviews));
    
    if (conditions.length > 0) {
      q = query(collection(db, 'shops'), ...conditions, limit(ITEMS_PER_PAGE));
    }
    
    return q;
  };

  const buildProductQuery = (searchTerm: string, category: string, minPrice: string, maxPrice: string, minRating: number) => {
    let q = query(collection(db, 'listings'), limit(ITEMS_PER_PAGE));
    
    const conditions = [];
    if (category) conditions.push(where('category', '==', category));
    if (minPrice) conditions.push(where('price', '>=', Number(minPrice)));
    if (maxPrice) conditions.push(where('price', '<=', Number(maxPrice)));
    if (minRating > 0) conditions.push(where('rating', '>=', minRating));
    
    if (conditions.length > 0) {
      q = query(collection(db, 'listings'), ...conditions, limit(ITEMS_PER_PAGE));
    }
    
    return q;
  };

  const scoreShops = (shops: any[], searchTerm: string) => {
    return shops.map(shop => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      if (shop.name?.toLowerCase().includes(term)) score += 5;
      if (shop.tagline?.toLowerCase().includes(term)) score += 3;
      if (shop.bio?.toLowerCase().includes(term)) score += 2;
      if (shop.shopReviewCount) score += Math.min(shop.shopReviewCount, 10);
      if (shop.shopRating) score += shop.shopRating * 2;
      return { ...shop, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  };

  const scoreProducts = (products: any[], searchTerm: string) => {
    return products.map(product => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      if (product.name?.toLowerCase().includes(term)) score += 5;
      if (product.description?.toLowerCase().includes(term)) score += 3;
      if (product.category?.toLowerCase().includes(term)) score += 2;
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(term))) score += 1;
      if (product.rating) score += product.rating * 2;
      if (product.reviewCount) score += Math.min(product.reviewCount, 10);
      return { ...product, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    performSearch(search);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    performSearch(search, true);
  };

  const renderSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

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
      {searching && renderSkeleton()}
      
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
          {hasMore && (
            <div className="text-center mt-8">
              <Button onClick={loadMore} variant="outline">
                Încarcă mai multe
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
} 