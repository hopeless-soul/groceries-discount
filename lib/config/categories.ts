export const baseCategoryKeys = ['other'] as const;
export type BaseCategoryKey = (typeof baseCategoryKeys)[number];

export const groceryCategoryKeys = [
  'bakery',
  'fruits',
  'vegetables',
  'meat',
  'seafood',
  'sport',
  'beverages',
  'snacks',
  'grains&pasta',
  'sauces',
  'household&cleaning',
] as const;
export type GroceryCategoryKey = (typeof groceryCategoryKeys)[number];

export const categoryKeys = [
  ...baseCategoryKeys,
  ...groceryCategoryKeys,
] as const;

export type CategoryKey = (typeof categoryKeys)[number];

export const categoryDescriptions: Record<CategoryKey, string> = {
  other: 'Other',
  bakery: 'Bakery',
  fruits: 'Fruits',
  vegetables: 'Vegetables',
  meat: 'Meat',
  seafood: 'Fish & Seafood',
  sport: 'Sports Nutrition',
  beverages: 'Beverages',
  snacks: 'Snacks & Sweets',
  'grains&pasta': 'Grains & Pasta',
  sauces: 'Sauces',
  'household&cleaning': 'Household',
};
