"use client";

import { getUrgencyColor } from "@/lib/validity";
import type { CartItem } from "@/lib/types";

interface CartItemRowProps {
  item: CartItem;
  onRemove: (offerId: string) => void;
}

export function CartItemRow({ item, onRemove }: CartItemRowProps) {
  const urgencyColor = getUrgencyColor(item.daysLeft);

  return (
    <div className="flex items-start gap-3 border-b border-[#e4e4e7] py-3">
      {item.imageUrl ? (
        // next/image requires whitelisting each provider's image host in
        // next.config.ts; Lidl's isn't confirmed yet, so a plain <img> is
        // used to render both stores' images without that dependency.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          className="h-11 w-11 flex-shrink-0 rounded-[6px] object-cover"
        />
      ) : (
        <div className="h-11 w-11 flex-shrink-0 rounded-[6px] bg-[#f4f4f5]" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.storeDotColor }} />
          {item.storeLabel}
        </div>
        <p className="text-sm font-medium">{item.title}</p>
        <p data-testid="cart-item-valid-until" className="text-xs" style={{ color: urgencyColor }}>
          Valid until {new Date(item.validUntil).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{item.discountedPrice.toFixed(2)}</p>
        <p className="text-xs text-[#a1a1aa] line-through">{item.regularPrice.toFixed(2)}</p>
        <p className="text-xs font-semibold text-[#15803d]">-{item.discountPercent}%</p>
      </div>
      <button type="button" aria-label="Remove" onClick={() => onRemove(item.id)} className="text-[#a1a1aa]">
        ×
      </button>
    </div>
  );
}
