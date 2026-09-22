"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useLocationStore } from "@/lib/stores/location-store";
import { ChangeLocationDialog } from "@/components/location/ChangeLocationDialog";

export function AppHeader() {
  const itemCount = useCartStore((s) => s.items.length);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);
  const toggleSidebarOpen = useDashboardUiStore((s) => s.toggleSidebarOpen);
  const city = useLocationStore((s) => s.city);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e4e4e7] bg-white px-6">
      <button
        type="button"
        onClick={toggleSidebarOpen}
        aria-label="Open menu"
        className="flex items-center gap-2 lg:cursor-default"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#18181b]" />
        <span className="text-base font-semibold">Basket</span>
      </button>

      <span className="hidden text-sm text-[#71717a] lg:inline">{today}</span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setLocationDialogOpen(true)}
          aria-label="Change location"
        >
          {city ?? "Set location"}
        </Button>
        <Button variant="outline" onClick={toggleCartOpen} aria-label="Cart">
          Cart
          {itemCount > 0 && (
            <Badge data-testid="cart-count-badge" className="ml-2">
              {itemCount}
            </Badge>
          )}
        </Button>
      </div>

      <ChangeLocationDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} />
    </header>
  );
}
