
// src/components/blog/ArticleCard.tsx
import type { Article } from '@/lib/mock-data-types'; // Updated import
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, ArrowRight, Feather } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface ArticleCardProps {
  article: Article;
  categoryName?: string;
}

export function ArticleCard({ article, categoryName }: ArticleCardProps) {
  const formattedDate = format(new Date(article.publishedDate), 'd MMMM yyyy', { locale: ro });

  return (
    <Card className="group flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 h-full bg-card">
      <Link href={`/blog/${article.categorySlug}/${article.slug}`} className="block">
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={article.dataAiHint}
          />
        </div>
      </Link>
      <CardHeader className="p-4">
        {categoryName && (
          <Link href={`/blog/${article.categorySlug}`} className="text-sm text-primary hover:underline mb-1 inline-block">
            Din Tărâmul "{categoryName}"
          </Link>
        )}
        <Link href={`/blog/${article.categorySlug}/${article.slug}`} className="block">
          <CardTitle className="text-xl font-semibold leading-tight hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
        </Link>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Feather className="h-4 w-4" />
            <span>Scrisă de {article.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            <span>La data de {formattedDate}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="link" asChild className="text-primary hover:text-accent px-0">
          <Link href={`/blog/${article.categorySlug}/${article.slug}`}>
            Citește Povestea Întreagă <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
