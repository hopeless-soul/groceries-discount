"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { OfferCard } from "@/components/dashboard/OfferCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DisplayOffer } from "@/lib/types";

interface VirtualizedOfferGridProps {
  offers: DisplayOffer[];
}

const PHONE_QUERY = "(max-width: 767px)";
const ESTIMATED_ROW_HEIGHT = 280;

export function VirtualizedOfferGrid({ offers }: VirtualizedOfferGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const COLUMNS = isPhone ? 2 : 3;

  const rows: DisplayOffer[][] = [];
  for (let i = 0; i < offers.length; i += COLUMNS) {
    rows.push(offers.slice(i, i + COLUMNS));
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
    // Seeds a usable viewport before ResizeObserver reports the real size
    // (avoids rendering zero rows on first paint, and in jsdom, where
    // ResizeObserver never actually fires).
    initialRect: { width: 800, height: 800 },
  });

  return (
    <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto p-3 sm:pl-3 md:pl-6 sm:pb-3 md:pb-6">
      <div
        style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={isPhone ? "grid grid-cols-2 gap-3 pb-3" : "grid grid-cols-3 gap-5 pb-5"}
            >
              {row.map((offer) => (
                <OfferCard key={`${offer.shop}-${offer.id}`} offer={offer} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
