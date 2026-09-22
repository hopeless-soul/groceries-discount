"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { OfferGrid } from "@/components/dashboard/OfferGrid";
import { CartPanel } from "@/components/dashboard/CartPanel";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useLocationStore } from "@/lib/stores/location-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export default function DashboardPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const cartOpen = useDashboardUiStore((s) => s.cartOpen);
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
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 flex h-[60px] items-center border-b border-[#e4e4e7] bg-white px-6">
            <div className="relative max-w-sm w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
              <Input placeholder="Search products…" className="h-9 pl-8" />
            </div>
          </div>
          <OfferGrid data={data} loading={loading} error={error} refetch={refetch} />
        </div>
        {cartOpen && <CartPanel />}
      </div>
    </div>
  );
}
