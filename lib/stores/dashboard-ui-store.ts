import { create } from "zustand";
import { StoreName } from "@/providers/types";

interface DashboardUiState {
  selectedStore: StoreName;
  activeCategory: string;
  cartOpen: boolean;
  setSelectedStore: (store: StoreName) => void;
  setActiveCategory: (category: string) => void;
  toggleCartOpen: () => void;
}

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  selectedStore: StoreName.Lidl,
  activeCategory: "All",
  cartOpen: true,
  setSelectedStore: (store) => set({ selectedStore: store, activeCategory: "All" }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),
}));
