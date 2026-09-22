import { create } from "zustand";
import { StoreName } from "@/providers/types";

interface DashboardUiState {
  selectedStore: StoreName;
  activeCategory: string;
  cartOpen: boolean;
  searchQuery: string;
  setSelectedStore: (store: StoreName) => void;
  setActiveCategory: (category: string) => void;
  toggleCartOpen: () => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  selectedStore: StoreName.Lidl,
  activeCategory: "All",
  cartOpen: true,
  searchQuery: "",
  setSelectedStore: (store) => set({ selectedStore: store, activeCategory: "All" }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
