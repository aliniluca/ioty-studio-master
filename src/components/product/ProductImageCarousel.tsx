"use client";
import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageType {
  id: string;
  url: string;
  alt: string;
  dataAiHint?: string;
}

interface ProductImageCarouselProps {
  images: ImageType[];
}

export function ProductImageCarousel({ images }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Card className="aspect-square w-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Nicio poză de basm aici</p>
      </Card>
    );
  }

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="space-y-4">
      <Card className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-lg group">
        <Image
          key={currentImage.id} // Force re-render for transition effect if any
          src={currentImage.url}
          alt={currentImage.alt}
          layout="fill"
          objectFit="cover"
          className="transition-opacity duration-300 ease-in-out"
          data-ai-hint={currentImage.dataAiHint || 'chipul comorii'}
          priority={currentIndex === 0} // Prioritize first image
        />
        {images.length > 1 && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPrevious} 
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Poză de basm anterioară"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNext} 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Poză de basm următoare"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </Card>
      
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "aspect-square rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                index === currentIndex ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
              )}
              aria-label={`Privește poza de basm ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                layout="fill"
                objectFit="cover"
                data-ai-hint={`${image.dataAiHint} miniatură` || 'micul chip al comorii'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
