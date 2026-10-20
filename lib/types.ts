import type { CategoryKey } from '@/lib/config/categories';
import type { ShopKey } from '@/lib/config/shops';

export interface Category {
  id: string;
  name: string;
  count: number;
}

export type BoundaryBox = [[number, number], [number, number]];

export interface ApiFlyer {
  id: string;
  validFrom: string;
  validTo: string;
}

export interface ApiShop {
  shop: ShopKey;
  name: string;
  flyer: ApiFlyer | null;
}

/** Normalized OfferDto: nulls defaulted, position dropped, ready for display conversion. */
export interface ApiOffer {
  id: string;
  pageId: string;
  flyerId: string;
  shop: ShopKey;
  title: string;
  category: CategoryKey[];
  basePrice: number | null;
  discountedPrice: number | null;
  loyaltyPrice: number | null;
  loyaltyDiscount: number | null;
  discount: number | null;
  validFrom: string;
  validTo: string;
  imageUrl: string;
  isCropped: boolean;
  boundaryBox: BoundaryBox;
}

/** Ready for display. daysLeft and ringPercent are recomputed on every toDisplayOffer call. */
export interface DisplayOffer {
  id: string;
  shop: ShopKey;
  displayTitle: string;
  displaySubtitle: string | null;
  category: CategoryKey[];
  basePrice: number | null;
  discountedPrice: number | null;
  loyaltyPrice: number | null;
  loyaltyDiscount: number | null;
  displayDiscount: number | null;
  validFrom: string;
  validTo: string;
  daysLeft: number;
  ringPercent: number;
  imageUrl: string;
  isCropped: boolean;
  boundaryBox: BoundaryBox;
}

export type CartItem = DisplayOffer;
