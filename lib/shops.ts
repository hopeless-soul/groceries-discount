import type { ShopKey } from '@/lib/config/shops';
import type { ApiShop } from '@/lib/types';

export type ShopStatus = 'available' | 'outdated' | 'restricted';

/**
 * `today` is a local YYYY-MM-DD string. String comparison is valid for that
 * format, and validTo === today still counts as available.
 */
export function getShopStatus(shop: ShopKey, apiShops: ApiShop[], today: string): ShopStatus {
  const entry = apiShops.find((s) => s.shop === shop);
  if (!entry) return 'restricted';
  if (!entry.flyer || entry.flyer.validTo < today) return 'outdated';
  return 'available';
}

export const shopStatusMessages: Record<Exclude<ShopStatus, 'available'>, string> = {
  restricted: 'Shop is restricted.',
  outdated: "Shop's flyer is outdated. Try again later.",
};
