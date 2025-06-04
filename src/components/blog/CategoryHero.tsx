
// src/components/blog/CategoryHero.tsx
import type { BlogCategory } from '@/lib/mock-data-types'; // Updated import
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface CategoryHeroProps {
  category: BlogCategory;
}

export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <section className="relative py-16 md:py-24 text-center bg-gradient-to-b from-card via-background to-card rounded-lg shadow-lg overflow-hidden">
      {category.imageUrl && (
         <div className="absolute inset-0 z-0 opacity-20">
            <Image 
                src={category.imageUrl}
                alt={`Fundal pentru tărâmul de povești ${category.name}`}
                layout="fill" 
                objectFit="cover"
                className="pointer-events-none"
                data-ai-hint={category.dataAiHint || 'imagine categorie blog'}
            />
        </div>
      )}
      <div className="relative z-10 container mx-auto px-4">
        <BookOpen className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Povești din Tărâmul "{category.name}"
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {category.description}
        </p>
      </div>
    </section>
  );
}
