
// src/app/blog/[categorySlug]/[articleSlug]/page.tsx
import Link from 'next/link';
import Image from 'next/image';
// Removed: blogArticles, blogCategories, type Article from '@/lib/blog-data';
import type { Article, BlogCategory } from '@/lib/blog-data-types'; // Import types
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronLeft, Tag, UserCircle, Scroll } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { ArticleCard } from '@/components/blog/ArticleCard';

export async function generateStaticParams() {
  // Since mock data is removed, return an empty array.
  // In a real app, this would fetch all article slugs from your database.
  return [];
}

export default function ArticlePage({ params }: { params: { categorySlug: string, articleSlug: string } }) {
  // Article and category fetching logic would go here if we had a data source.
  // For now, article and category will always be undefined.
  const article: Article | undefined = undefined;
  const category: BlogCategory | undefined = undefined;
  const relatedArticles: Article[] = [];

  if (!article || !category) {
     return (
        <div className="text-center py-12">
            <Scroll className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> 
            <h2 className="text-xl font-semibold text-foreground mb-2">Poveste Rătăcită...</h2>
            <p className="text-muted-foreground">Se pare că această cronică s-a pierdut prin arhivele fermecate ale Tărâmului sau nu a fost scrisă încă. Meșterii cronicari lucrează la noi povești!</p>
            <Link href="/blog" className="mt-4 inline-block text-primary hover:underline">
                Înapoi la Cronicile ioty
            </Link>
        </div>
    );
  }

  const formattedDate = format(new Date(article.publishedDate), 'd MMMM yyyy, HH:mm', { locale: ro });
  // Related articles logic would need a data source. For now, it's empty.

  return (
    <div className="max-w-4xl mx-auto">
      <article className="space-y-8">
        <Link href={`/blog/${category.slug}`} className="inline-flex items-center text-primary hover:underline mb-6 text-sm">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Înapoi la Tărâmul de Povești "{category.name}"
        </Link>

        <header className="space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {article.author.avatarUrl && <AvatarImage src={article.author.avatarUrl} alt={article.author.name} data-ai-hint={article.author.dataAiHintAvatar || 'chip povestitor'} />}
                <AvatarFallback>{article.author.name.substring(0,1)}</AvatarFallback>
              </Avatar>
              <span>Scrisă de {article.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Publicată la {formattedDate}</span>
            </div>
          </div>
        </header>

        {article.imageUrl && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-muted">
            <Image
              src={article.imageUrl}
              alt={article.title}
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint={article.dataAiHint}
            />
          </div>
        )}

        <div
          className="prose prose-lg dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-accent prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-1">Cuvinte cheie din poveste:</span>
            {article.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {relatedArticles.length > 0 && (
        <>
          <Separator className="my-12" />
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Alte Povești din Tărâmul "{category.name}"</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedArticles.map(relatedArt => (
                <ArticleCard key={relatedArt.id} article={relatedArt} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
