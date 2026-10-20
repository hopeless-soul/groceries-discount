"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { VirtualizedOfferGrid } from "@/components/dashboard/VirtualizedOfferGrid";
import { useAllShopOffers } from "@/hooks/useShopOffers";
import { shopConfigs, shopKeys, type ShopKey } from "@/lib/config/shops";
import type { CategoryKey } from "@/lib/config/categories";
import { referencePrice, toDisplayOffer } from "@/lib/display";
import { isOfferAvailable } from "@/lib/availability";
import { normalizeSearchText } from "@/lib/normalizeText";
import { shopStatusMessages, type ShopStatus } from "@/lib/shops";
import { useDashboardUiStore, type SortOption } from "@/lib/stores/dashboard-ui-store";
import type { DisplayOffer } from "@/lib/types";

interface OfferGridProps {
  selectedStore: ShopKey;
  statuses: Record<ShopKey, ShopStatus> | null;
  shopsLoading: boolean;
  shopsError: Error | null;
  refetchShops: () => void;
  /** Display offers of the selected shop, already filtered to started offers. */
  offers: DisplayOffer[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function sortOffers(offers: DisplayOffer[], sortBy: SortOption): DisplayOffer[] {
  if (sortBy === "default") return offers;
  if (sortBy === "discountPercent") {
    return [...offers].sort((a, b) => (b.displayDiscount ?? -1) - (a.displayDiscount ?? -1));
  }
  const saving = (o: DisplayOffer) => (o.basePrice ?? 0) - (referencePrice(o) ?? 0);
  return [...offers].sort((a, b) => saving(b) - saving(a));
}

function Message({ children }: { children: ReactNode }) {
  return <p className="p-6 text-sm text-[#71717a]">{children}</p>;
}

export function OfferGrid({
  selectedStore,
  statuses,
  shopsLoading,
  shopsError,
  refetchShops,
  offers,
  loading,
  error,
  refetch,
}: OfferGridProps) {
  const activeCategory = useDashboardUiStore((s) => s.activeCategory);
  const searchQuery = useDashboardUiStore((s) => s.searchQuery);
  const sortBy = useDashboardUiStore((s) => s.sortBy);

  const query = normalizeSearchText(searchQuery);
  const isSearching = query.length > 0;
  const availableKeys = statuses ? shopKeys.filter((key) => statuses[key] === "available") : [];
  const allShops = useAllShopOffers(availableKeys, isSearching && statuses !== null);

  if (shopsError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-[#71717a]">Couldn&apos;t load shops. Please try again.</p>
        <Button variant="outline" onClick={refetchShops}>
          Retry
        </Button>
      </div>
    );
  }

  if (isSearching) {
    if (shopsLoading || allShops.loading) return <Message>Loading offers…</Message>;

    if (allShops.error) {
      return <Message>Couldn&apos;t load offers. Please try again.</Message>;
    }

    const unavailable = statuses
      ? shopKeys.filter((key) => statuses[key] !== "available")
      : [];
    const matches = sortOffers(
      allShops.offers
        .map((offer) => toDisplayOffer(offer))
        .filter(
          (o) =>
            isOfferAvailable(o) &&
            (normalizeSearchText(o.displayTitle).includes(query) ||
              normalizeSearchText(o.displaySubtitle ?? "").includes(query)),
        ),
      sortBy,
    );

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Padding lives here, not on the wrapper, so the grid keeps the same width as outside search. */}
        <div className="flex-shrink-0 px-3 pt-3 md:pl-6 md:pt-6">
          {unavailable.map((key) => (
            <p key={key} className="mb-2 text-sm text-[#71717a]">
              {shopConfigs[key].name}: {shopStatusMessages[statuses![key] as Exclude<ShopStatus, "available">]}
            </p>
          ))}
          <p className="text-sm text-[#71717a]">
            {matches.length === 0
              ? <>No offers match &quot;{searchQuery}&quot;.</>
              : <>{matches.length} offers match &quot;{searchQuery}&quot;</>}
          </p>
        </div>
        {matches.length > 0 && <VirtualizedOfferGrid offers={matches} />}
      </div>
    );
  }

  if (shopsLoading) return <Message>Loading offers…</Message>;

  const status = statuses?.[selectedStore];
  if (status && status !== "available") {
    return <Message>{shopStatusMessages[status]}</Message>;
  }

  if (loading) return <Message>Loading offers…</Message>;

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-[#71717a]">Couldn&apos;t load offers. Please try again.</p>
        <Button variant="outline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  const filtered = sortOffers(
    activeCategory === "All"
      ? offers
      : offers.filter((o) => o.category.includes(activeCategory as CategoryKey)),
    sortBy,
  );

  if (filtered.length === 0) {
    return (
      <Message>
        No offers {activeCategory === "All" ? "" : "in this category "}at {shopConfigs[selectedStore].name}.
      </Message>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-0">
      <VirtualizedOfferGrid offers={filtered} />
    </div>
  );
}
