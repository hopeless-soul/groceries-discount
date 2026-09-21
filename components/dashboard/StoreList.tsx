"use client";

import { groceryProviders } from "@/providers/registry";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function StoreList() {
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);
  const setSelectedStore = useDashboardUiStore((s) => s.setSelectedStore);

  return (
    <div className="flex flex-col gap-1 p-3">
      {Object.values(groceryProviders).map((provider) => {
        const active = provider.name === selectedStore;
        return (
          <button
            key={provider.name}
            type="button"
            onClick={() => setSelectedStore(provider.name)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
              active ? "bg-[#f4f4f5] border border-[#e4e4e7]" : "border border-transparent"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: provider.dotColor }}
            />
            {provider.label}
          </button>
        );
      })}
    </div>
  );
}
