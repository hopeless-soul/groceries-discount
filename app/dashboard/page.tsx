"use client";

import { Search, X } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { OfferGrid } from "@/components/dashboard/OfferGrid";
import { CartPanel } from "@/components/dashboard/CartPanel";
import { ReceiptButton } from "@/components/dashboard/ReceiptButton";
import { ReceiptOverlay } from "@/components/dashboard/ReceiptOverlay";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Input } from "@/components/ui/input";
import { isOfferAvailable } from "@/lib/availability";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useShopOffers } from "@/hooks/useShopOffers";
import { useShops } from "@/hooks/useShops";
import { categoryDescriptions } from "@/lib/config/categories";
import { shopConfigs } from "@/lib/config/shops";
import { countByCategory, toDisplayOffer } from "@/lib/display";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export default function DashboardPage() {
  const hasHydrated = useHasHydrated();
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const searchQuery = useDashboardUiStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardUiStore((s) => s.setSearchQuery);
  const showImages = useDashboardUiStore((s) => s.showImages);
  const toggleShowImages = useDashboardUiStore((s) => s.toggleShowImages);
  const sortBy = useDashboardUiStore((s) => s.sortBy);
  const setSortBy = useDashboardUiStore((s) => s.setSortBy);

  const shops = useShops();
  const selectedAvailable = shops.statuses?.[selectedStore] === "available";
  const shopOffers = useShopOffers(selectedStore, selectedAvailable);

  if (!hasHydrated) {
    return null;
  }

  const displayOffers = (shopOffers.offers ?? [])
    .map((offer) => toDisplayOffer(offer))
    .filter((offer) => isOfferAvailable(offer));
  const counts = countByCategory(displayOffers);
  const categories = shopConfigs[selectedStore].categories
    .filter((key) => counts.has(key))
    .map((key) => ({ id: key, name: categoryDescriptions[key], count: counts.get(key)! }));

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          categories={categories}
          totalCount={displayOffers.length}
          statuses={shops.statuses}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex gap-2 justify-between h-[60px] flex-shrink-0 items-center border-b border-[#e4e4e7] bg-white px-6">
            <div className="relative max-w-sm w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
              <Input
                placeholder="Search products…"
                className="h-9 pl-8 pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <DashboardFilters
              showImages={showImages}
              toggleShowImages={toggleShowImages}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>
          <OfferGrid
            selectedStore={selectedStore}
            statuses={shops.statuses}
            shopsLoading={shops.loading}
            shopsError={shops.error}
            refetchShops={shops.refetch}
            offers={displayOffers}
            loading={shopOffers.loading}
            error={shopOffers.error}
            refetch={shopOffers.refetch}
          />
        </div>
        <CartPanel />
      </div>
      <ReceiptButton />
      <ReceiptOverlay />
    </div>
  );
}
