"use client";

import { Button } from "@/components/ui/button";
import { OfferCard } from "@/components/dashboard/OfferCard";
import type { UseDashboardDataResult } from "@/hooks/useDashboardData";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

type OfferGridProps = UseDashboardDataResult;

export function OfferGrid({ data, loading, error, refetch }: OfferGridProps) {
  const activeCategory = useDashboardUiStore((s) => s.activeCategory);

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
    <div className="p-6">
      <p className="mb-4 text-sm text-[#71717a]">
        {filtered.length} offers at {data?.store.label}
      </p>
      <div className="grid grid-cols-3 gap-5">
        {filtered.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            storeId={data!.store.id}
            storeLabel={data!.store.label}
            storeDotColor={data!.store.dotColor}
          />
        ))}
      </div>
    </div>
  );
}
