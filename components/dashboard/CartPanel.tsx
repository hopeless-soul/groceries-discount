"use client";

import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/dashboard/CartItemRow";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function CartPanel() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const toggleCartOpen = useDashboardUiStore((s) => s.toggleCartOpen);

  return (
    <aside className="flex w-[320px] flex-col border-l border-[#e4e4e7] bg-white">
      <div className="flex h-[60px] items-center justify-between border-b border-[#e4e4e7] px-4">
        <span className="text-sm font-semibold">Cart · {items.length}</span>
        <button type="button" aria-label="Close" onClick={toggleCartOpen} className="text-[#a1a1aa]">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#a1a1aa]">No items in your cart yet.</p>
        ) : (
          items.map((item) => <CartItemRow key={item.id} item={item} onRemove={remove} />)
        )}
      </div>

      <div className="border-t border-[#e4e4e7] p-4">
        <Button
          variant="outline"
          className="w-full text-[#dc2626]"
          disabled={items.length === 0}
          onClick={clear}
        >
          Clear cart
        </Button>
      </div>
    </aside>
  );
}
