import type { CSSProperties } from 'react';
import type { CategoryKey } from '@/lib/config/categories';
import { croppedImageConfig } from '@/lib/config/image';
import type { ApiOffer, BoundaryBox, DisplayOffer } from '@/lib/types';
import { computeDaysLeft, computeRingPercent } from '@/lib/validity';

// shortcut: stub until real title parsing exists, upgrade when the API splits title and subtitle
export function parseTitle(title: string): { displayTitle: string; subtitle: string | null } {
  return { displayTitle: title, subtitle: 'lorem ipsum' };
}

/** The price the discount is measured from: the loyalty price when the shop has one. */
export function referencePrice(offer: Pick<ApiOffer, 'loyaltyPrice' | 'discountedPrice'>): number | null {
  return offer.loyaltyPrice ?? offer.discountedPrice;
}

export function computeDisplayDiscount(
  offer: Pick<ApiOffer, 'basePrice' | 'loyaltyPrice' | 'discountedPrice'>,
): number | null {
  const reference = referencePrice(offer);
  if (offer.basePrice == null || offer.basePrice <= 0 || reference == null) return null;
  return Math.round((1 - reference / offer.basePrice) * 100);
}

export function toDisplayOffer(offer: ApiOffer, now: Date = new Date()): DisplayOffer {
  const { displayTitle, subtitle } = parseTitle(offer.title);
  return {
    id: offer.id,
    shop: offer.shop,
    displayTitle,
    subtitle,
    category: offer.category,
    basePrice: offer.basePrice,
    discountedPrice: offer.discountedPrice,
    loyaltyPrice: offer.loyaltyPrice,
    loyaltyDiscount: offer.loyaltyDiscount,
    displayDiscount: computeDisplayDiscount(offer),
    validFrom: offer.validFrom,
    validTo: offer.validTo,
    // Validity dates are whole days: an offer stays valid for all of its validTo day.
    daysLeft: computeDaysLeft(`${offer.validTo}T23:59:59`, now),
    ringPercent: computeRingPercent(`${offer.validFrom}T00:00:00`, `${offer.validTo}T23:59:59`, now),
    imageUrl: offer.imageUrl,
    isCropped: offer.isCropped,
    boundaryBox: offer.boundaryBox,
  };
}

/**
 * CSS that shows only the boundaryBox part of a full-page image inside a
 * container of any size. Fractions are of the page, so background-size is the
 * inverse of the box size and background-position shifts by the box offset.
 */
export function cropStyle(box: BoundaryBox): CSSProperties {
  const p = croppedImageConfig.boundaryPadding;
  const clamp = (v: number) => (croppedImageConfig.clampValues ? Math.min(1, Math.max(0, v)) : v);
  const [[x1, y1], [x2, y2]] = [
    [clamp(box[0][0] - p), clamp(box[0][1] - p)],
    [clamp(box[1][0] + p), clamp(box[1][1] + p)],
  ];
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0 || h <= 0) return { backgroundSize: '100% 100%' };
  const position = (start: number, size: number) => (size >= 1 ? 0 : (start / (1 - size)) * 100);
  return {
    backgroundSize: `${100 / w}% ${100 / h}%`,
    backgroundPosition: `${position(x1, w)}% ${position(y1, h)}%`,
    backgroundRepeat: 'no-repeat',
  };
}

export function formatValidDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString();
}

export function countByCategory(offers: DisplayOffer[]): Map<CategoryKey, number> {
  const counts = new Map<CategoryKey, number>();
  for (const offer of offers) {
    for (const category of offer.category) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return counts;
}
