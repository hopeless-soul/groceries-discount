"use client";

import { Receipt } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function ReceiptButton() {
  const itemCount = useCartStore((s) => s.items.length);
  const toggleReceiptOpen = useDashboardUiStore((s) => s.toggleReceiptOpen);

  if (itemCount === 0) return null;

  return (
    <button
      type="button"
      aria-label="View receipt"
      onClick={toggleReceiptOpen}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#18181b] text-white shadow-lg"
    >
      <Receipt className="h-5 w-5" />
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1 text-xs font-bold text-white">
        {itemCount}
      </span>
    </button>
  );
}
