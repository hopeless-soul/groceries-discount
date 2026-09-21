"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { OfferGrid } from "@/components/dashboard/OfferGrid";
import { CartPanel } from "@/components/dashboard/CartPanel";
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
  const { data } = useDashboardData(selectedStore);

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
          <OfferGrid />
        </div>
        {cartOpen && <CartPanel />}
      </div>
    </div>
  );
}
