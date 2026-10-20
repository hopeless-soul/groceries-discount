"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Plus } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useQrCardsStore, type QrCard } from "@/lib/stores/qr-cards-store";
import { QrCardFormDialog } from "./QrCardFormDialog";
import { QrCardItem } from "./QrCardItem";

export function QrListDialog() {
  const qrOpen = useDashboardUiStore((s) => s.qrOpen);
  const toggleQrOpen = useDashboardUiStore((s) => s.toggleQrOpen);
  const cards = useQrCardsStore((s) => s.cards);
  const remove = useQrCardsStore((s) => s.remove);
  // `null` = form closed; `{ card: null }` = creating; `{ card }` = editing.
  const [form, setForm] = useState<{ card: QrCard | null } | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect).on("reInit", onSelect);
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api]);

  return (
    <Dialog
      open={qrOpen}
      onOpenChange={(open) => {
        if (open !== qrOpen) toggleQrOpen();
      }}
    >
      <DialogPortal>
        {/* Frameless overlay: a tap on empty space (the popup itself, not a child) closes it. */}
        <DialogPrimitive.Popup
          data-testid="qr-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) toggleQrOpen();
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-4 py-6 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          <DialogPrimitive.Title className="sr-only">My cards</DialogPrimitive.Title>

          <button
            type="button"
            aria-label="Add card"
            onClick={() => setForm({ card: null })}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f4f4f5] text-[#18181b] shadow-lg transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>

          {cards.length === 0 ? (
            <div role="status" className="w-72 rounded-2xl bg-white px-5 py-4 text-center shadow-xl">
              <p className="text-sm font-semibold text-[#18181b]">No cards yet</p>
              <p className="mt-0.5 text-xs text-[#71717a]">Tap + to add your first card</p>
            </div>
          ) : (
            <Carousel orientation="vertical" setApi={setApi} className="h-[min(38rem,calc(100dvh-12rem))] w-[min(24rem,100%)]">
              <CarouselContent>
                {cards.map((card) => (
                  <CarouselItem key={card.id} className="flex items-center py-1">
                    <QrCardItem card={card} onEdit={() => setForm({ card })} onDelete={() => remove(card.id)} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}

          {cards.length > 0 && (
            <div className="rounded-sm bg-[#f4f4f5] px-6 py-2 text-base font-mono font-medium text-[#18181b] shadow-sm">
              {index + 1}/{cards.length}
            </div>
          )}

          {form && (
            <QrCardFormDialog key={form.card?.id ?? "new"} card={form.card} onClose={() => setForm(null)} />
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
