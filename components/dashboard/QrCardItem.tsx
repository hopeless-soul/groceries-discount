"use client";

import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { shopConfigs } from "@/lib/config/shops";
import type { QrCard } from "@/lib/stores/qr-cards-store";

export type CodeMode = "qr" | "barcode";

interface QrCardItemProps {
  card: QrCard;
  mode: CodeMode;
  onModeChange: (mode: CodeMode) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function QrCardItem({ card, mode, onModeChange, onEdit, onDelete }: QrCardItemProps) {
  const shop = shopConfigs[card.shop];

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white text-[#18181b] shadow-xl">
      <div className="flex justify-center px-4 pt-4">
        {/* One switch: a click anywhere on it flips the mode. Checked = barcode. */}
        <button
          type="button"
          role="switch"
          aria-checked={mode === "barcode"}
          aria-label="Barcode"
          onClick={() => onModeChange(mode === "qr" ? "barcode" : "qr")}
          className="relative inline-grid cursor-pointer grid-cols-2 rounded-full bg-[#f4f4f5] p-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {/* Sliding thumb: both labels are equal width, so it moves by exactly its own width. */}
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[#18181b] shadow-sm transition-transform duration-150 ease-out"
            style={{ transform: mode === "qr" ? "translateX(0)" : "translateX(100%)" }}
          />
          <span
            aria-hidden
            className={cn("relative z-10 px-4 py-1.5 font-medium text-[#71717a] transition-colors duration-150", mode === "qr" && "text-white")}
          >
            QR
          </span>
          <span
            aria-hidden
            className={cn("relative z-10 px-4 py-1.5 font-medium text-[#71717a] transition-colors duration-150", mode === "barcode" && "text-white")}
          >
            Barcode
          </span>
        </button>
      </div>

      <div className="flex h-[min(24rem,calc(100dvh-21rem))] items-center justify-center overflow-hidden px-4">
        {mode === "qr" ? (
          // Height and QR width share one bound (100dvh - 21rem), so the card fits the carousel on short screens.
          <div data-testid="qr-code" className="w-full max-w-[min(20rem,calc(100dvh-21rem))]">
            <QRCodeSVG value={card.value} size={256} className="h-auto w-full" />
          </div>
        ) : (
          <div data-testid="barcode" className="max-w-full mx-6 py-6">
            <Barcode value={card.value} format="CODE128" width={1.5} height={110} displayValue={false} margin={0} />
            <div className="mt-2 text-center font-mono text-xs text-[#71717a]">{card.value}</div>
          </div>
        )}
      </div>

      {/* ~8% tint of the shop color (hex alpha 14) so cards are recognisable at a glance. */}
      <div
        className="flex items-center justify-between gap-3 border-t border-[#f4f4f5] px-4 py-3"
        style={{ backgroundColor: `${shop.color}14` }}
      >
        <div className="min-w-0">
          <div className="flex items-center text-base font-semibold">
            <span
              data-testid="shop-dot"
              className="mr-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: shop.color }}
            />
            {shop.name}
          </div>
          <div className="truncate text-sm text-[#71717a]">{card.name}</div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" className="size-10 rounded-full" aria-label={`Edit ${card.name}`} onClick={onEdit}>
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full text-[#dc2626] hover:text-[#dc2626]"
            aria-label={`Delete ${card.name}`}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}
