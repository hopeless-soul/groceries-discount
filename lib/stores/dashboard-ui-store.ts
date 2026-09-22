import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreName } from "@/providers/types";

interface DashboardUiState {
  selectedStore: StoreName;
  activeCategory: string;
  cartOpen: boolean;
  searchQuery: string;
  showImages: boolean;
  setSelectedStore: (store: StoreName) => void;
  setActiveCategory: (category: string) => void;
  toggleCartOpen: () => void;
  setSearchQuery: (query: string) => void;
  toggleShowImages: () => void;
}

export const useDashboardUiStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      selectedStore: StoreName.Lidl,
      activeCategory: "All",
      cartOpen: true,
      searchQuery: "",
      showImages: false,
      setSelectedStore: (store) => set({ selectedStore: store, activeCategory: "All" }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleShowImages: () => set((state) => ({ showImages: !state.showImages })),
    }),
    {
      name: "groceries-discount:dashboard-ui",
      partialize: (state) => ({ showImages: state.showImages }),
    },
  ),
);
