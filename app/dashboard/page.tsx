"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { OfferGrid } from "@/components/dashboard/OfferGrid";
import { CartPanel } from "@/components/dashboard/CartPanel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore, type SortOption } from "@/lib/stores/dashboard-ui-store";

const SORT_LABELS: Record<SortOption, string> = {
  default: "Default",
  discountPercent: "Most discounted %",
  discountAmount: "Most discounted €",
};

export default function DashboardPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const cartOpen = useDashboardUiStore((s) => s.cartOpen);
  const searchQuery = useDashboardUiStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardUiStore((s) => s.setSearchQuery);
  const showImages = useDashboardUiStore((s) => s.showImages);
  const toggleShowImages = useDashboardUiStore((s) => s.toggleShowImages);
  const sortBy = useDashboardUiStore((s) => s.sortBy);
  const setSortBy = useDashboardUiStore((s) => s.setSortBy);
  const { data, loading, error, refetch } = useDashboardData(selectedStore);

  useEffect(() => {
    if (hasHydrated && (!country || !city)) {
      router.replace("/");
    }
  }, [hasHydrated, country, city, router]);

  if (!hasHydrated || !country || !city) {
    return null;
  }

  const categories = data?.categories ?? [];
  const totalCount = data?.offers.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[240px] overflow-y-auto border-r border-[#e4e4e7] bg-white">
          <StoreList />
          <CategoryList categories={categories} totalCount={totalCount} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex justify-between h-[60px] flex-shrink-0 items-center border-b border-[#e4e4e7] bg-white px-6">
            <div className="relative max-w-sm w-full">
              {/* TODO: Shudcn searchbar */}
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
            <div className="flex items-center">
              <label className="ml-4 flex items-center gap-2 text-sm text-[#71717a]">
                <Switch checked={showImages} onCheckedChange={toggleShowImages} />
                Show images
              </label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger aria-label="Sort by" className="ml-4 w-[190px]">
                  <SelectValue placeholder="Sort">{(value) => SORT_LABELS[value as SortOption]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <SelectItem key={option} value={option}>
                      {SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <OfferGrid data={data} loading={loading} error={error} refetch={refetch} />
        </div>
        {cartOpen && <CartPanel />}
      </div>
    </div>
  );
}
