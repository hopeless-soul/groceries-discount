import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (offerId: string) => void;
  clear: () => void;
  has: (offerId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set((state) => ({ items: [...state.items, item] })),
      remove: (offerId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== offerId) })),
      clear: () => set({ items: [] }),
      has: (offerId) => get().items.some((i) => i.id === offerId),
    }),
    { name: "groceries-discount:cart" },
  ),
);
