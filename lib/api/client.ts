import type { ApiOffer, ApiShop } from '@/lib/types';
import type { ShopKey } from '@/lib/config/shops';
import type { OfferDto, ShopDto } from './dto';
import { normalizeOffers, normalizeShop } from './normalize';

function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error('NEXT_PUBLIC_API_URL is not set');
  return url.replace(/\/$/, '');
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchShops(): Promise<ApiShop[]> {
  const dtos = await getJson<ShopDto[]>('/shops');
  return dtos.map(normalizeShop);
}

export async function fetchShopOffers(shop: ShopKey): Promise<ApiOffer[]> {
  const dtos = await getJson<OfferDto[]>(`/shops/${shop}/offers`);
  return normalizeOffers(dtos, apiBaseUrl());
}
