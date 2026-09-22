"use client";

import { Button } from "@/components/ui/button";
import { VirtualizedOfferGrid } from "@/components/dashboard/VirtualizedOfferGrid";
import type { UseDashboardDataResult } from "@/hooks/useDashboardData";
import { useAllStoresOffers } from "@/hooks/useAllStoresOffers";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useLocationStore } from "@/lib/stores/location-store";

type OfferGridProps = UseDashboardDataResult;

export function OfferGrid({ data, loading, error, refetch }: OfferGridProps) {
  const activeCategory = useDashboardUiStore((s) => s.activeCategory);
  const searchQuery = useDashboardUiStore((s) => s.searchQuery);
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;
  const allStores = useAllStoresOffers(country, city, isSearching);

  if (isSearching) {
    if (allStores.loading) {
      return <p className="p-6 text-sm text-[#71717a]">Loading offers…</p>;
    }

    if (allStores.error) {
      return <p className="p-6 text-sm text-[#71717a]">Couldn&apos;t load offers. Please try again.</p>;
    }

    const matches = allStores.offers.filter(
      (o) => o.title.toLowerCase().includes(query) || o.subtitle.toLowerCase().includes(query),
    );

    if (matches.length === 0) {
      return <p className="p-6 text-sm text-[#71717a]">No offers match &quot;{searchQuery}&quot;.</p>;
    }

    return (
      <div className="flex h-full flex-col p-6">
        <p className="mb-4 flex-shrink-0 text-sm text-[#71717a]">
          {matches.length} offers match &quot;{searchQuery}&quot;
        </p>
        <VirtualizedOfferGrid
          offers={matches}
          getKey={(offer) => `${offer.storeId}-${offer.id}`}
          getStoreProps={(offer) => ({
            storeId: offer.storeId,
            storeLabel: offer.storeLabel,
            storeDotColor: offer.storeDotColor,
          })}
        />
      </div>
    );
  }

  if (loading) {
    return <p className="p-6 text-sm text-[#71717a]">Loading offers…</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-6">
        <p className="text-sm text-[#71717a]">Couldn&apos;t load offers. Please try again.</p>
        <Button variant="outline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  const offers = data?.offers ?? [];
  const filtered =
    activeCategory === "All" ? offers : offers.filter((o) => o.categoryId === activeCategory);

  if (filtered.length === 0) {
    return (
      <p className="p-6 text-sm text-[#71717a]">
        No offers {activeCategory === "All" ? "" : "in this category "}at {data?.store.label}.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col p-0">
      {/* <p className="mb-4 flex-shrink-0 text-sm text-[#71717a]">
        {filtered.length} offers at {data?.store.label}
      </p> */}
      <VirtualizedOfferGrid
        offers={filtered}
        getKey={(offer) => offer.id}
        getStoreProps={() => ({
          storeId: data!.store.id,
          storeLabel: data!.store.label,
          storeDotColor: data!.store.dotColor,
        })}
      />
    </div>
  );
}
