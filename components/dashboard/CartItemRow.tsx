"use client";

import { OfferImage } from "@/components/dashboard/OfferImage";
import { OfferPreviewDialog } from "@/components/dashboard/OfferPreviewDialog";
import { shopConfigs } from "@/lib/config/shops";
import { formatValidDate, referencePrice } from "@/lib/display";
import { computeDaysLeft, getUrgencyColor } from "@/lib/validity";
import type { CartItem } from "@/lib/types";

interface CartItemRowProps {
  item: CartItem;
  onRemove: (offerId: string) => void;
}

export function CartItemRow({ item, onRemove }: CartItemRowProps) {
  const shop = shopConfigs[item.shop];
  const urgencyColor = getUrgencyColor(computeDaysLeft(`${item.validTo}T23:59:59`));
  const price = referencePrice(item);

  return (
    <div className="flex items-start gap-3 border-b border-[#e4e4e7] py-3">
      <OfferPreviewDialog offer={item} className="flex flex-1 items-start gap-3 text-left">
        <OfferImage offer={item} className="h-11 w-11 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-[#71717a]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: shop.color }} />
            {shop.name}
          </div>
          <p className="text-sm font-medium">{item.displayTitle}</p>
          <p data-testid="cart-item-valid-until" className="text-xs" style={{ color: urgencyColor }}>
            Valid until {formatValidDate(item.validTo)}
          </p>
        </div>
      </OfferPreviewDialog>
      <div className="text-right">
        {price != null && <p className="text-sm font-bold">{price.toFixed(2)}</p>}
        {item.basePrice != null && (
          <p className="text-xs text-[#a1a1aa] line-through">{item.basePrice.toFixed(2)}</p>
        )}
        {item.displayDiscount != null && (
          <p className="text-xs font-semibold text-[#15803d]">-{item.displayDiscount}%</p>
        )}
      </div>
      <button type="button" aria-label="Remove" onClick={() => onRemove(item.id)} className="text-[#a1a1aa]">
        ×
      </button>
    </div>
  );
}
