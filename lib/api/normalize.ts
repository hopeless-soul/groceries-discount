import type { ApiOffer, ApiShop, BoundaryBox } from '@/lib/types';
import type { OfferDto, ShopDto } from './dto';

/** Relative image paths from the API are prefixed with the base URL; absolute ones are kept. */
function resolveImageUrl(url: string, apiBaseUrl: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${apiBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}

export function normalizeOffer(dto: OfferDto, apiBaseUrl: string): ApiOffer {
  return {
    id: dto.id,
    pageId: dto.pageId,
    flyerId: dto.flyerId,
    shop: dto.shop,
    title: dto.title,
    category: dto.category ?? ['other'],
    basePrice: dto.basePrice,
    discountedPrice: dto.discountedPrice,
    loyaltyPrice: dto.loyaltyPrice,
    loyaltyDiscount: dto.loyaltyDiscount,
    discount: dto.discount,
    validFrom: dto.validFrom,
    validTo: dto.validTo,
    imageUrl: resolveImageUrl(dto.imageUrl, apiBaseUrl),
    isCropped: true,
    boundaryBox: dto.boundaryBox as BoundaryBox,
  };
}

/** Sorts by `position` (page order) first, then normalizes. */
export function normalizeOffers(dtos: OfferDto[], apiBaseUrl: string): ApiOffer[] {
  return [...dtos]
    .sort((a, b) => a.position - b.position)
    .map((dto) => normalizeOffer(dto, apiBaseUrl));
}

export function normalizeShop(dto: ShopDto): ApiShop {
  return {
    shop: dto.shop,
    name: dto.name,
    flyer: dto.flyer
      ? { id: dto.flyer.id, validFrom: dto.flyer.validFrom, validTo: dto.flyer.validTo }
      : null,
  };
}
