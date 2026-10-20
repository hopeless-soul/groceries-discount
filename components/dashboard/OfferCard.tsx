"use client";

import { useState } from "react";
import { BookOpenText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
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
  const [showSource, setShowSource] = useState(false);
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
        {preview ? (
          <DialogClose aria-label="Close" className="-m-2 flex p-2 text-[#71717a]">
            <X className="size-4" />
          </DialogClose>
        ) : (
          <ValidityRing ringPercent={offer.ringPercent} daysLeft={offer.daysLeft} />
        )}
      </div>

      {preview ? (
        <div className="relative">
          <OfferImage
            offer={showSource ? { ...offer, isCropped: false } : offer}
            fit="contain"
            className="h-[60vh] w-full"
          />
          {offer.isCropped && (
            <button
              type="button"
              role="switch"
              aria-checked={showSource}
              aria-label="Show full page"
              onClick={() => setShowSource((v) => !v)}
              className="absolute right-2 top-2 grid h-7 w-14 grid-cols-2 items-center rounded-full border border-[#e4e4e7] bg-white/80 p-0.5 backdrop-blur origin-top-right scale-120"
            >
              <span
                className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#18181b] transition-transform duration-200 ${showSource ? "translate-x-full" : ""}`}
              />
              <ImageIcon className={`relative mx-auto size-3.5 ${showSource ? "text-[#71717a]" : "text-white"}`} />
              <BookOpenText className={`relative mx-auto size-3.5 ${showSource ? "text-white" : "text-[#71717a]"}`} />
            </button>
          )}
        </div>
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

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-[10px]">
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
        </div>
        {preview && (
          <div className="flex self-stretch items-start">
            <div className="origin-top-right scale-130">
              <ValidityRing ringPercent={offer.ringPercent} daysLeft={offer.daysLeft} />
            </div>
          </div>
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
