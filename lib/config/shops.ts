import { baseCategoryKeys, groceryCategoryKeys, type CategoryKey } from './categories';

export const shopKeys = ['lidl', 'kaufland', 'billa', 'tesco'] as const;
export type ShopKey = (typeof shopKeys)[number];

interface ShopConfig {
  name: string;
  color: string;
  categories: readonly CategoryKey[];
}

export const shopConfigs: Record<ShopKey, ShopConfig> = {
  lidl: {
    name: 'Lidl',
    color: '#2563eb',
    categories: [...baseCategoryKeys, ...groceryCategoryKeys],
  },
  kaufland: {
    name: 'Kaufland',
    color: '#dc2626',
    categories: [...baseCategoryKeys, ...groceryCategoryKeys],
  },
  billa: {
    name: 'Billa',
    color: '#ea580c',
    categories: [...baseCategoryKeys, ...groceryCategoryKeys],
  },
  tesco: {
    name: 'Tesco',
    color: '#7c3aed',
    categories: [...baseCategoryKeys, ...groceryCategoryKeys],
  },
};
