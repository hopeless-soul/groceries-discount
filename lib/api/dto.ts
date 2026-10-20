// Mirrors openapi.json of nest-ai-flyer-parser. Keep nullability as the spec has it.
import type { CategoryKey } from '@/lib/config/categories';
import type { ShopKey } from '@/lib/config/shops';

export interface ShopDto {
  shop: ShopKey;
  name: string;
  flyer: FlyerSummaryDto | null;
}

export interface FlyerSummaryDto {
  id: string;
  validFrom: string; // YYYY-MM-DD
  validTo: string; // YYYY-MM-DD
}

export interface OfferDto {
  id: string;
  pageId: string;
  flyerId: string;
  shop: ShopKey;
  position: number;
  title: string;
  category: CategoryKey[] | null;
  basePrice: number | null;
  discountedPrice: number | null;
  discount: number | null;
  loyaltyPrice: number | null;
  loyaltyDiscount: number | null;
  validFrom: string;
  validTo: string;
  imageUrl: string;
  boundaryBox: [[number, number], [number, number]];
}

export interface PageDto {
  status: string;
  id: string;
  pageNumber: number;
  width: number | null;
  height: number | null;
  imageUrl: string | null;
}
