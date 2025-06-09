
// src/app/blog/page.tsx
import Link from 'next/link';
import Image from 'next/image';
// Removed: blogCategories, blogArticles, type BlogCategory, type Article from '@/lib/blog-data';
import type { Article, BlogCategory } from '@/lib/blog-data-types'; // Import types
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { Scroll, Feather, BookOpen } from 'lucide-react';

// Since mock data is removed, these will be empty.
const blogCategories: BlogCategory[] = [];
const blogArticles: Article[] = [];

function getCategoryName(slug: string): string {
  const category = blogCategories.find(cat => cat.slug === slug);
  return category ? category.name : 'Tărâm Necunoscut';
}

export default function BlogPage() {
  const recentArticles: Article[] = []; // Will be empty
  // Sorting logic for recentArticles is removed as blogArticles is empty.

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-secondary/30 rounded-lg">
        <div className="flex justify-center items-center mb-4">
            <Scroll className="mx-auto h-16 w-16 text-primary" />
            <Feather className="mx-auto h-12 w-12 text-accent -ml-4" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Cronicile ioty: Povești din Tărâmul Meșterilor</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Descoperă inspirație, poveștile meșterilor fauri, noutăți din târguri și cele mai noi tendințe din universul artizanatului românesc. Cronicarii adună noi slove în fiecare zi!
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-foreground mb-8 text-center md:text-left">Explorează Colțurile de Poveste ale Tărâmului</h2>
        {blogCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogCategories.map((category) => (
              <Link key={category.id} href={`/blog/${category.slug}`} className="group block">
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 bg-card h-full flex flex-col">
                  {category.imageUrl && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={category.imageUrl}
                        alt={`Imagine pentru ${category.name}`}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={category.dataAiHint || 'categorie blog artizanat'}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription>{category.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
           <div className="text-center py-12 bg-card rounded-lg shadow">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground">Colțuri de Poveste în Pregătire</h3>
            <p className="text-muted-foreground mt-2">Categoriile de cronici vor fi dezvăluite aici pe măsură ce Tărâmul ioty se umple de povești.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-semibold text-foreground mb-8 text-center md:text-left">Ultimele Povești din Atelierul Cronicarului</h2>
        {recentArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} categoryName={getCategoryName(article.categorySlug)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <Feather className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground">Cerneala Încă nu s-a Uscat</h3>
            <p className="text-muted-foreground mt-2">Povestitorii noștri încă adună slove... Revino curând pentru povești proaspete din Tărâmul ioty!</p>
          </div>
        )}
      </section>
    </div>
  );
}
