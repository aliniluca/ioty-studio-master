
// src/app/blog/[categorySlug]/page.tsx
import Link from 'next/link';
// Removed: blogCategories, blogArticles, type BlogCategory, type Article from '@/lib/blog-data';
import type { Article, BlogCategory } from '@/lib/blog-data-types'; // Import types
import { ArticleCard } from '@/components/blog/ArticleCard';
import { CategoryHero } from '@/components/blog/CategoryHero';
import { BookHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export async function generateStaticParams() {
  // Since mock data is removed, return an empty array.
  // In a real app, this would fetch all category slugs from your database.
  return [];
}

export default function BlogCategoryPage({ params }: { params: { categorySlug: string } }) {
  // Category and articles fetching logic would go here if we had a data source.
  // For now, category will be undefined and articlesInCategory empty.
  const category: BlogCategory | undefined = undefined; 
  const articlesInCategory: Article[] = [];

  if (!category) {
    return (
        <div className="text-center py-12">
            <BookHeart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Tărâm de Povești Neexplorat</h2>
            <p className="text-muted-foreground mb-4">Se pare că acest colț de cronică încă nu a fost descoperit sau nu are povești scrise. Cronicarii ioty adună noi slove chiar acum!</p>
            <Button asChild>
                <Link href="/blog">Mergi la Cronicile ioty</Link>
            </Button>
        </div>
    );
  }

  // Sorting logic remains, but articlesInCategory will be empty.

  return (
    <div className="space-y-12">
      <CategoryHero category={category} />

      {articlesInCategory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articlesInCategory.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookHeart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Nicio Poveste (Încă!) în Acest Tărâm</h2>
          <p className="text-muted-foreground">Povestitorii noștri încă adună slove și isprăvi pentru acest colț de cronică. Revino curând!</p>
        </div>
      )}
    </div>
  );
}
