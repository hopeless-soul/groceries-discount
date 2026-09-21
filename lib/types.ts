export interface Store {
  id: string;
  label: string;
  dotColor: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  regularPrice: number;
  discountedPrice: number;
  discountPercent: number;
  validUntil: string;
  daysLeft: number;
  ringPercent: number;
}

export interface DashboardData {
  store: Store;
  categories: Category[];
  offers: Offer[];
}

export interface CartItem extends Offer {
  storeId: string;
  storeLabel: string;
  storeDotColor: string;
}
