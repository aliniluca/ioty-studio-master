// src/components/shared/StarRating.tsx
"use client";
import { Star } from 'lucide-react'; // Removed StarHalf for simplicity in editable version
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  isEditable?: boolean;
  onRatingChange?: (newRating: number) => void;
}

export function StarRating({ 
  rating: initialRating, 
  reviewCount, 
  size = 16, 
  isEditable = false, 
  onRatingChange 
}: StarRatingProps) {
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const actualRating = isEditable ? currentRating : initialRating;

  const handleStarClick = (index: number) => {
    if (!isEditable) return;
    const newRating = index + 1;
    setCurrentRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleStarHover = (index: number) => {
    if (!isEditable) return;
    setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (!isEditable) return;
    setHoverRating(0);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex" onMouseLeave={handleMouseLeave}>
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          const displayRating = hoverRating || actualRating;
          
          let fillClass = "text-muted fill-muted"; // Default empty
          if (displayRating >= starValue) {
             fillClass = "text-primary fill-primary"; // Filled
          }

          return (
            <Star
              key={i}
              className={cn(
                "stroke-none transition-colors", // stroke-none to make fill more prominent
                isEditable ? "cursor-pointer" : "cursor-default",
                fillClass
              )}
              style={{ width: size, height: size }}
              onClick={() => handleStarClick(i)}
              onMouseEnter={() => handleStarHover(i)}
            />
          );
        })}
      </div>
      {reviewCount !== undefined && !isEditable && (
        <span className="ml-1 text-xs text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
}
