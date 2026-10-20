"use client";

import { useEffect, useState } from "react";
import { croppedImageConfig } from "@/lib/config/image";
import { cropStyle } from "@/lib/display";
import type { DisplayOffer } from "@/lib/types";

interface OfferImageProps {
  offer: Pick<DisplayOffer, "imageUrl" | "isCropped" | "boundaryBox" | "displayTitle">;
  className?: string;
  /** "contain" fits the whole image over a stretched, blurred copy of it. */
  fit?: "cover" | "contain";
}

/**
 * Shows the page image of an offer. Cropped offers show only their
 * boundaryBox region; uncropped offers show the whole page.
 */
export function OfferImage({ offer, className = "", fit = "cover" }: OfferImageProps) {
  const contain = fit === "contain";
  const fn = contain ? "min" : "max";
  const [page, setPage] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!offer.isCropped) return;
    const img = new Image();
    img.onload = () => setPage({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = offer.imageUrl;
  }, [offer.isCropped, offer.imageUrl]);

  if (offer.isCropped) {
    const [[x1, y1], [x2, y2]] = offer.boundaryBox;
    // Pixel aspect ratio of the crop region; unknown until the page image has loaded.
    const ratio = page ? ((x2 - x1) * page.w) / ((y2 - y1) * page.h) : 0;
    const valid = Number.isFinite(ratio) && ratio > 0;
    const background = { ...cropStyle(offer.boundaryBox), backgroundImage: `url("${offer.imageUrl}")` };
    return (
      <div
        role="img"
        aria-label={offer.displayTitle}
        className={`relative overflow-hidden rounded-[6px] bg-[#f4f4f5] @container-size ${className}`}
        style={valid ? undefined : background}
      >
        {valid && (contain || !croppedImageConfig.clampValues) && (
          // Stretched, blurred copy behind the crop: fills the strips an unclamped box leaves past the page.
          // scale-110 hides the transparent edge fade of the blur; the wrapper clips the overflow.
          // Always clamped, so it only shows real page content.
          <div
            className="absolute inset-0 scale-110 blur-md"
            style={{ ...cropStyle(offer.boundaryBox, true), backgroundImage: background.backgroundImage }}
          />
        )}
        {valid && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              // The crop keeps its aspect ratio and fills ("cover") or fits inside ("contain") the container.
              width: `${fn}(100cqw, 100cqh * ${ratio})`,
              height: `${fn}(100cqh, 100cqw / ${ratio})`,
              ...background,
            }}
          />
        )}
      </div>
    );
  }

  if (contain) {
    return (
      <div className={`relative overflow-hidden rounded-[6px] bg-[#f4f4f5] ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={offer.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-fill blur-md" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={offer.imageUrl} alt={offer.displayTitle} className="relative h-full w-full object-contain" />
      </div>
    );
  }

  return (
    // The image comes from the API host, so next/image would need a remotePattern for it.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={offer.imageUrl}
      alt={offer.displayTitle}
      loading="lazy"
      className={`overflow-hidden rounded-[6px] bg-[#f4f4f5] object-cover ${className}`}
    />
  );
}
