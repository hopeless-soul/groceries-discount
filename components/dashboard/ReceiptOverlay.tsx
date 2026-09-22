"use client";

import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { groupCartItemsByStore, type ReceiptStoreGroup } from "@/lib/receipt";

const ZIGZAG_EDGE =
  "linear-gradient(135deg, transparent 8px, #fdfdf8 8px) 0 0, linear-gradient(-135deg, transparent 8px, #fdfdf8 8px) 0 0";

function ZigzagEdge() {
  return (
    <div
      aria-hidden
      className="h-3 w-full bg-[#fdfdf8]"
      style={{
        backgroundImage: ZIGZAG_EDGE,
        backgroundSize: "16px 16px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

function StoreGroupBlock({ group }: { group: ReceiptStoreGroup }) {
  return (
    <div className="py-3">
      <p className="text-sm font-bold">{group.storeLabel.toUpperCase()}</p>
      {group.items.map((item) => (
        <div key={item.id} className="flex justify-between gap-3 py-1 text-sm">
          <span className="truncate">{item.title}</span>
          <span className="flex-shrink-0">{item.discountedPrice.toFixed(2)}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-dashed border-[#18181b]/40 pt-2">
        <div className="flex justify-between text-sm font-semibold">
          <span>SUBTOTAL</span>
          <span>{group.subtotal.toFixed(2)}</span>
        </div>
        {group.savings > 0 && (
          <div className="flex justify-between text-xs text-[#71717a]">
            <span>Saved</span>
            <span>{group.savings.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReceiptOverlay() {
  const items = useCartStore((s) => s.items);
  const receiptOpen = useDashboardUiStore((s) => s.receiptOpen);
  const toggleReceiptOpen = useDashboardUiStore((s) => s.toggleReceiptOpen);

  if (items.length === 0) return null;

  const { groups, grandTotal, grandSavings } = groupCartItemsByStore(items);

  return (
    <Dialog
      open={receiptOpen}
      onOpenChange={(open) => {
        if (open !== receiptOpen) toggleReceiptOpen();
      }}
    >
      <DialogPortal>
        <button
          type="button"
          aria-label="Close"
          onClick={toggleReceiptOpen}
          className="fixed right-6 top-6 z-50 text-2xl text-white"
        >
          ×
        </button>
        <div className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto font-mono text-[#18181b] shadow-lg">
          <ZigzagEdge />
          <div className="bg-[#fdfdf8] px-5 py-4">
            <p className="text-center text-base font-bold tracking-widest">GROCERIES DISCOUNT</p>
            <p className="text-center text-xs text-[#71717a]">{new Date().toLocaleString()}</p>

            <div className="my-3 border-t border-dashed border-[#18181b]/40" />

            {groups.map((group) => (
              <StoreGroupBlock key={group.storeId} group={group} />
            ))}

            <div className="my-2 border-t-2 border-dashed border-[#18181b]" />

            <div className="flex justify-between text-lg font-bold">
              <span>GRAND TOTAL</span>
              <span>{grandTotal.toFixed(2)}</span>
            </div>
            {grandSavings > 0 && (
              <div className="flex justify-between text-sm text-[#15803d]">
                <span>TOTAL SAVED</span>
                <span>{grandSavings.toFixed(2)}</span>
              </div>
            )}

            <p className="mt-4 text-center text-sm font-bold">THANK YOU!</p>

            <div
              aria-hidden
              className="mx-auto mt-3 h-10 w-full max-w-[220px]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #18181b 0, #18181b 2px, transparent 2px, transparent 5px)",
              }}
            />
            <p className="text-center text-xs text-[#71717a]">
              {groups.reduce((sum, g) => sum + g.items.length, 0)} ITEMS
            </p>
          </div>
          <ZigzagEdge />
        </div>
      </DialogPortal>
    </Dialog>
  );
}
