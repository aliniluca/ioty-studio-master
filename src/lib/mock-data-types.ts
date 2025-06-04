// src/lib/mock-data-types.ts

export interface Review {
  id: string;
  user: { 
    name: string; 
    avatarUrl?: string;
    dataAiHint?: string;
  };
  rating: number;
  date: string; // e.g., "acum 2 săptămâni"
  comment: string;
}

export interface ProductImage {
  id: string;
  url: string; // Can be a Picsum URL or a data URI
  alt: string;
  dataAiHint?: string;
}

export interface SellerBasic {
  id: string;
  name: string;
}

export type ListingStatus = 'pending_approval' | 'approved' | 'rejected' | 'draft';

export interface ListingAdvertisementOptions {
  isAdvertised: boolean;
  // Future options: budget, duration, etc.
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  shippingPrice: number;
  shippingTime: string;
  images: ProductImage[];
  videos?: any[]; 
  sellerId: string; 
  seller: SellerBasic; // Added for easier access to seller info
  rating: number;
  reviewCount: number;
  stock: number;
  category: string; 
  categorySlug: string; 
  subcategoryName?: string;
  subcategorySlug?: string; 
  tags: string[];
  reviews: Review[];
  dataAiHint?: string; 
  status: ListingStatus;
  isFeatured?: boolean;
  advertisement?: ListingAdvertisementOptions;
  dateAdded: string; // ISO string for sorting by new
}

export interface ShopDetails {
  id: string;
  name: string;
  tagline: string;
  avatarUrl: string;
  bannerUrl: string;
  memberSince: string; 
  location: string;
  shopRating: number;
  shopReviewCount: number;
  bio: string;
  dataAiHintAvatar?: string;
  dataAiHintBanner?: string;
  productIds: string[]; 
  reviews: Review[]; 
  isFeatured?: boolean;
  userId: string; // Link to the user who owns the shop
}

// Copied from previous mock-data.ts for ListingCard component
export interface Listing {
  id: string;
  name: string;
  seller: SellerBasic;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  dataAiHint?: string;
  status: ListingStatus; // Ensure listing card also knows status
}

// Types for blog data previously in blog-data.ts
export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface ArticleAuthor {
  name: string;
  avatarUrl?: string;
  dataAiHintAvatar?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  author: ArticleAuthor;
  publishedDate: string; // ISO date string
  excerpt: string;
  content: string; // HTML or Markdown
  imageUrl: string;
  dataAiHint: string;
  tags?: string[];
}

// Utility to convert ProductDetails to Listing
export function productDetailsToListing(product: ProductDetails): Listing {
  return {
    id: product.id,
    name: product.name,
    seller: product.seller,
    price: product.price,
    imageUrl: product.images[0]?.url || '',
    rating: product.rating,
    reviewCount: product.reviewCount,
    dataAiHint: product.dataAiHint,
    status: product.status,
  };
}

export function EditShopForm({}: EditShopFormProps) {
  console.log('Componenta EditShopForm s-a montat!');
  // ... restul codului
}

