"use client";

import { Button } from "@/components/ui/button";
import { OfferImage } from "@/components/dashboard/OfferImage";
import { OfferPreviewDialog } from "@/components/dashboard/OfferPreviewDialog";
import { ValidityRing } from "@/components/dashboard/ValidityRing";
import { shopConfigs } from "@/lib/config/shops";
import { formatValidDate, referencePrice } from "@/lib/display";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import type { DisplayOffer } from "@/lib/types";

interface OfferCardProps {
  offer: DisplayOffer;
  /** Popup variant: big fitted image, no cart button. */
  preview?: boolean;
}

export function OfferCard({ offer, preview = false }: OfferCardProps) {
  const inCart = useCartStore((s) => s.has(offer.id));
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const showImages = useDashboardUiStore((s) => s.showImages);
  const shop = shopConfigs[offer.shop];
  const price = referencePrice(offer);
  const percent = offer.displayDiscount;

  return (
    <div className="flex flex-col gap-[10px] rounded-xl border border-[#e4e4e7] bg-white p-[14px] transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: shop.color }} />
          {shop.name}
        </div>
        <ValidityRing ringPercent={offer.ringPercent} daysLeft={offer.daysLeft} />
      </div>

      {preview ? (
        <OfferImage offer={offer} fit="contain" className="h-[60vh] w-full" />
      ) : (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: showImages ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            {showImages && (
              <OfferPreviewDialog offer={offer}>
                <OfferImage offer={offer} className="h-40 w-full" />
              </OfferPreviewDialog>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold">{offer.displayTitle}</p>
        {offer.displaySubtitle && <p className="text-xs text-[#71717a]">{offer.displaySubtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {offer.basePrice != null && (
          <span className="text-xs text-[#a1a1aa] line-through">{offer.basePrice.toFixed(2)}</span>
        )}
        <span className="text-lg font-bold">{price != null ? price.toFixed(2) : "—"}</span>
        {percent != null && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${percent === 0
                ? "bg-[#f4f4f5] text-[#71717a]"
                : percent > 50
                  ? "bg-[#ffedd5] text-[#c2410c]"
                  : "bg-[#dcfce7] text-[#15803d]"
              }`}
          >
            -{percent}%
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#a1a1aa]">Valid until {formatValidDate(offer.validTo)}</p>

      {!preview && (
        <div className="flex flex-col justify-end flex-1">
          <Button
            variant={inCart ? "default" : "outline"}
            className="w-full"
            onClick={() => (inCart ? remove(offer.id) : add(offer))}
          >
            {inCart ? "In cart" : "Add to cart"}
          </Button>
        </div>
      )}
    </div>
  );
}
