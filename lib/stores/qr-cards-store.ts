import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShopKey } from "@/lib/config/shops";

export interface QrCard {
  id: string;
  shop: ShopKey;
  name: string;
  value: string;
}

interface QrCardsState {
  cards: QrCard[];
  add: (card: Omit<QrCard, "id">) => void;
  update: (id: string, patch: Partial<Omit<QrCard, "id">>) => void;
  remove: (id: string) => void;
}

export function defaultCardName(shop: ShopKey, cards: QrCard[]): string {
  return `${shop} card #${cards.filter((c) => c.shop === shop).length + 1}`;
}

export const useQrCardsStore = create<QrCardsState>()(
  persist(
    (set) => ({
      cards: [],
      // randomUUID is missing on insecure origins (e.g. http://LAN-IP on a phone).
      add: (card) =>
        set((state) => ({
          cards: [
            ...state.cards,
            { ...card, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` },
          ],
        })),
      update: (id, patch) =>
        set((state) => ({ cards: state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      remove: (id) => set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
    }),
    { name: "groceries-discount:qr-cards", version: 1 },
  ),
);
