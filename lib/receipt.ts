import type { CartItem } from "@/lib/types";

export interface ReceiptStoreGroup {
  storeId: string;
  storeLabel: string;
  items: CartItem[];
  subtotal: number;
  savings: number;
}

export interface ReceiptSummary {
  groups: ReceiptStoreGroup[];
  grandTotal: number;
  grandSavings: number;
}

export function groupCartItemsByStore(items: CartItem[]): ReceiptSummary {
  const order: string[] = [];
  const byStore = new Map<string, CartItem[]>();

  for (const item of items) {
    if (!byStore.has(item.storeId)) {
      byStore.set(item.storeId, []);
      order.push(item.storeId);
    }
    byStore.get(item.storeId)!.push(item);
  }

  const groups: ReceiptStoreGroup[] = order.map((storeId) => {
    const storeItems = byStore.get(storeId)!;
    const subtotal = storeItems.reduce((sum, i) => sum + i.discountedPrice, 0);
    const regularSubtotal = storeItems.reduce((sum, i) => sum + i.regularPrice, 0);
    return {
      storeId,
      storeLabel: storeItems[0].storeLabel,
      items: storeItems,
      subtotal,
      savings: regularSubtotal - subtotal,
    };
  });

  const grandTotal = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const grandSavings = groups.reduce((sum, g) => sum + g.savings, 0);

  return { groups, grandTotal, grandSavings };
}
