"use client";

import { cropStyle } from "@/lib/display";
import type { DisplayOffer } from "@/lib/types";

interface OfferImageProps {
  offer: Pick<DisplayOffer, "imageUrl" | "isCropped" | "boundaryBox" | "displayTitle">;
  className?: string;
}

/**
 * Shows the page image of an offer. Cropped offers show only their
 * boundaryBox region; uncropped offers show the whole page.
 */
export function OfferImage({ offer, className = "" }: OfferImageProps) {
  if (offer.isCropped) {
    return (
      <div
        role="img"
        aria-label={offer.displayTitle}
        className={`overflow-hidden rounded-[6px] bg-[#f4f4f5] ${className}`}
        style={{
          ...cropStyle(offer.boundaryBox),
          backgroundImage: `url("${offer.imageUrl}")`,
        }}
      />
    );
  }

  return (
    // The image comes from the API host, so next/image would need a remotePattern for it.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={offer.imageUrl}
      alt={offer.displayTitle}
      loading="lazy"
      className={`overflow-hidden rounded-[6px] bg-[#f4f4f5] object-contain ${className}`}
    />
  );
}
