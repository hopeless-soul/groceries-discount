"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { shopConfigs } from "@/lib/config/shops";
import type { QrCard } from "@/lib/stores/qr-cards-store";

type Mode = "qr" | "barcode";

const MODES: { mode: Mode; label: string }[] = [
  { mode: "qr", label: "QR" },
  { mode: "barcode", label: "Barcode" },
];

interface QrCardItemProps {
  card: QrCard;
  onEdit: () => void;
  onDelete: () => void;
}

export function QrCardItem({ card, onEdit, onDelete }: QrCardItemProps) {
  const [mode, setMode] = useState<Mode>("qr");
  const shop = shopConfigs[card.shop];

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white text-[#18181b] shadow-xl">
      <div className="flex justify-center px-4 pt-4">
        <div role="group" aria-label="Code type" className="inline-flex rounded-full bg-[#f4f4f5] p-1 text-sm">
          {MODES.map(({ mode: m, label }) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium text-[#71717a] transition-colors",
                mode === m && "bg-[#18181b] text-white shadow-sm"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-96 items-center justify-center overflow-hidden px-4">
        {mode === "qr" ? (
          // Scales down on short screens so the whole card stays inside the carousel viewport.
          <div data-testid="qr-code" className="w-full max-w-[min(20rem,44dvh)]">
            <QRCodeSVG value={card.value} size={256} className="h-auto w-full" />
          </div>
        ) : (
          <div data-testid="barcode" className="max-w-full px-6 py-6">
            <Barcode value={card.value} format="CODE128" width={1.5} height={110} displayValue={false} margin={0} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#f4f4f5] px-4 py-3">
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
          <Button type="button" variant="outline" size="icon" className="size-10 rounded-full" aria-label={`Delete ${card.name}`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}
