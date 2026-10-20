"use client";

import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import BascetLogo from "@/public/bascet_logo.svg";

interface AppHeaderProps {
  onRefresh: () => void;
  refreshing?: boolean;
}

export function AppHeader({ onRefresh, refreshing = false }: AppHeaderProps) {
  const itemCount = useCartStore((s) => s.items.length);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);
  const toggleSidebarOpen = useDashboardUiStore((s) => s.toggleSidebarOpen);
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
        <BascetLogo aria-hidden="true" className="h-8 w-8 text-[#18181b]" />
        <span className="text-base font-semibold">Basket</span>
      </button>

      <span className="hidden text-sm text-[#71717a] lg:inline">{today}</span>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={refreshing} aria-label="Refresh">
          <RefreshCw aria-hidden="true" className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
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
    </header>
  );
}
