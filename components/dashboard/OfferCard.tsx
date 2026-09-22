"use client";

import { Button } from "@/components/ui/button";
import { ValidityRing } from "@/components/dashboard/ValidityRing";
import { useCartStore } from "@/lib/stores/cart-store";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import type { Offer } from "@/lib/types";

interface OfferCardProps {
  offer: Offer;
  storeId: string;
  storeLabel: string;
  storeDotColor: string;
}

export function OfferCard({ offer, storeId, storeLabel, storeDotColor }: OfferCardProps) {
  const inCart = useCartStore((s) => s.has(offer.id));
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const showImages = useDashboardUiStore((s) => s.showImages);

  return (
    <div className="flex flex-col gap-[10px] rounded-xl border border-[#e4e4e7] bg-white p-[14px] transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: storeDotColor }} />
          {storeLabel}
        </div>
        <ValidityRing ringPercent={offer.ringPercent} daysLeft={offer.daysLeft} />
      </div>

      {offer.imageUrl && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: showImages ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            {/* next/image requires whitelisting each provider's image host in
                next.config.ts; Lidl's isn't confirmed yet, so a plain <img> is
                used to render both stores' images without that dependency. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.imageUrl}
              alt={offer.title}
              loading="lazy"
              className="h-16 w-16 rounded-[6px] object-cover"
            />
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold">{offer.title}</p>
        <p className="text-xs text-[#71717a]">{offer.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#a1a1aa] line-through">
          {offer.regularPrice.toFixed(2)}
        </span>
        <span className="text-lg font-bold">{offer.discountedPrice.toFixed(2)}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${offer.discountPercent === 0
              ? "bg-[#f4f4f5] text-[#71717a]"
              : offer.discountPercent > 50
                ? "bg-[#ffedd5] text-[#c2410c]"
                : "bg-[#dcfce7] text-[#15803d]"
            }`}
        >
          -{offer.discountPercent}%
        </span>
      </div>

      <p className="text-[11px] text-[#a1a1aa]">
        Valid until {new Date(offer.validUntil).toLocaleDateString()}
      </p>

      <div className="flex flex-col justify-end flex-1">
        <Button
          variant={inCart ? "default" : "outline"}
          className="w-full"
          onClick={() =>
            inCart
              ? remove(offer.id)
              : add({ ...offer, storeId, storeLabel, storeDotColor })
          }
        >
          {inCart ? "In cart" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
