"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { DialogClose, DialogPortal } from "@/components/ui/dialog";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { groupCartItemsByStore, type ReceiptStoreGroup } from "@/lib/receipt";

const ZIGZAG_TEETH = 14;

function buildZigzagClipPath(edge: "top" | "bottom"): string {
  const step = 100 / ZIGZAG_TEETH;
  const points: string[] = [];

  if (edge === "top") {
    points.push("0% 100%");
    for (let i = 0; i <= ZIGZAG_TEETH; i++) {
      points.push(`${i * step}% ${i % 2 === 0 ? 0 : 55}%`);
    }
    points.push("100% 100%");
  } else {
    points.push("0% 0%");
    for (let i = 0; i <= ZIGZAG_TEETH; i++) {
      points.push(`${i * step}% ${i % 2 === 0 ? 100 : 45}%`);
    }
    points.push("100% 0%");
  }

  return `polygon(${points.join(", ")})`;
}

function ZigzagEdge({ edge }: { edge: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={`h-4 w-full bg-[#fdfdf8] ${edge === "top" ? "translate-y-1" : "-translate-y-1"}`}
      style={{ clipPath: buildZigzagClipPath(edge) }}
    />
  );
}

function StoreGroupBlock({ group }: { group: ReceiptStoreGroup }) {
  return (
    <div className="pt-3 pb-6">
      <p className="text-sm font-bold">{group.storeLabel.toUpperCase()}</p>
      {group.items.map((item) => {
        const discountPct =
          item.regularPrice > 0
            ? Math.round((1 - item.discountedPrice / item.regularPrice) * 100)
            : 0;
        return (
          <div key={item.id} className="flex items-center justify-between gap-3 py-1 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-6 w-6 flex-shrink-0 rounded-sm border border-[#18181b]/20 object-cover"
                />
              ) : (
                <span className="h-6 w-6 flex-shrink-0 rounded-sm border border-dashed border-[#18181b]/20" />
              )}
              <span className="">
                {item.title}
                {discountPct > 0 && (
                  <span className="ml-2 text-xs text-[#71717a]">-{discountPct}%</span>
                )}
              </span>
            </span>
            <span className="flex-shrink-0">{item.discountedPrice.toFixed(2)}</span>
          </div>
        );
      })}
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
    <DialogPrimitive.Root
      open={receiptOpen}
      onOpenChange={(open) => {
        if (open !== receiptOpen) toggleReceiptOpen();
      }}
    >
      <DialogPortal>
        <DialogPrimitive.Popup className="overflow-auto scrollbar-none fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm overflow-auto scrollbar-nonefont-mono text-[#18181b] shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <DialogClose
            aria-label="Close"
            className="absolute right-2 top-5 z-10 text-xl leading-none text-[#71717a]"
          >
            ×
          </DialogClose>
          <ZigzagEdge edge="top" />
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
          <ZigzagEdge edge="bottom" />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
