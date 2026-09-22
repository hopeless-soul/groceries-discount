import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreName } from "@/providers/types";

export type SortOption = "default" | "discountPercent" | "discountAmount";

interface DashboardUiState {
  selectedStore: StoreName;
  activeCategory: string;
  cartOpen: boolean;
  sidebarOpen: boolean;
  receiptOpen: boolean;
  searchQuery: string;
  showImages: boolean;
  sortBy: SortOption;
  setSelectedStore: (store: StoreName) => void;
  setActiveCategory: (category: string) => void;
  toggleCartOpen: () => void;
  toggleSidebarOpen: () => void;
  toggleReceiptOpen: () => void;
  setSearchQuery: (query: string) => void;
  toggleShowImages: () => void;
  setSortBy: (sort: SortOption) => void;
}

export const useDashboardUiStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      selectedStore: StoreName.Lidl,
      activeCategory: "All",
      cartOpen: true,
      sidebarOpen: false,
      receiptOpen: false,
      searchQuery: "",
      showImages: true,
      sortBy: "default",
      setSelectedStore: (store) => set({ selectedStore: store, activeCategory: "All" }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),
      toggleSidebarOpen: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleReceiptOpen: () => set((state) => ({ receiptOpen: !state.receiptOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleShowImages: () => set((state) => ({ showImages: !state.showImages })),
      setSortBy: (sort) => set({ sortBy: sort }),
    }),
    {
      name: "groceries-discount:dashboard-ui",
      partialize: (state) => ({ showImages: state.showImages }),
    },
  ),
);
