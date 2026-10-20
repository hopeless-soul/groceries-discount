import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShopKey } from "@/lib/config/shops";

export type SortOption = "default" | "discountPercent" | "discountAmount";

interface DashboardUiState {
  selectedStore: ShopKey;
  activeCategory: string;
  cartOpen: boolean;
  sidebarOpen: boolean;
  receiptOpen: boolean;
  qrOpen: boolean;
  searchQuery: string;
  showImages: boolean;
  sortBy: SortOption;
  setSelectedStore: (store: ShopKey) => void;
  setActiveCategory: (category: string) => void;
  toggleCartOpen: () => void;
  toggleSidebarOpen: () => void;
  toggleReceiptOpen: () => void;
  toggleQrOpen: () => void;
  setSearchQuery: (query: string) => void;
  toggleShowImages: () => void;
  setSortBy: (sort: SortOption) => void;
}

export const useDashboardUiStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      selectedStore: "lidl",
      activeCategory: "All",
      cartOpen: true,
      sidebarOpen: false,
      receiptOpen: false,
      qrOpen: false,
      searchQuery: "",
      showImages: true,
      sortBy: "default",
      setSelectedStore: (store) => set({ selectedStore: store, activeCategory: "All" }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      toggleCartOpen: () => set((state) => ({ cartOpen: !state.cartOpen })),
      toggleSidebarOpen: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleReceiptOpen: () => set((state) => ({ receiptOpen: !state.receiptOpen })),
      toggleQrOpen: () => set((state) => ({ qrOpen: !state.qrOpen })),
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
