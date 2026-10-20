"use client";

import { shopConfigs, shopKeys, type ShopKey } from "@/lib/config/shops";
import { shopStatusMessages, type ShopStatus } from "@/lib/shops";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

interface StoreListProps {
  statuses: Record<ShopKey, ShopStatus> | null;
}

/** Unavailable shops stay in the list, muted, so the user can see why their offers are missing. */
export function StoreList({ statuses }: StoreListProps) {
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const setSelectedStore = useDashboardUiStore((s) => s.setSelectedStore);

  return (
    <div className="flex flex-col gap-1 p-3">
      {shopKeys.map((key) => {
        const shop = shopConfigs[key];
        const active = key === selectedStore;
        const status = statuses?.[key];
        const unavailable = status !== undefined && status !== "available";
        return (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedStore(key)}
            title={unavailable ? shopStatusMessages[status] : undefined}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
              active ? "bg-[#f4f4f5] border border-[#e4e4e7]" : "border border-transparent"
            } ${unavailable ? "text-[#a1a1aa]" : ""}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: shop.color }} />
            {shop.name}
          </button>
        );
      })}
    </div>
  );
}
