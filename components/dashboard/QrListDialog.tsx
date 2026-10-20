"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Plus, QrCode } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { useQrCardsStore, type QrCard } from "@/lib/stores/qr-cards-store";
import { QrCardFormDialog } from "./QrCardFormDialog";
import { QrCardItem, type CodeMode } from "./QrCardItem";

export function QrListDialog() {
  const qrOpen = useDashboardUiStore((s) => s.qrOpen);
  const toggleQrOpen = useDashboardUiStore((s) => s.toggleQrOpen);
  const cards = useQrCardsStore((s) => s.cards);
  const remove = useQrCardsStore((s) => s.remove);
  // `null` = form closed; `{ card: null }` = creating; `{ card }` = editing.
  const [form, setForm] = useState<{ card: QrCard | null } | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  // One mode for every card, so flipping the switch on one card flips them all.
  const [mode, setMode] = useState<CodeMode>("qr");

  // The carousel remounts each time the overlay opens, so resync the counter to its fresh position (slide 1).
  const handleApi = useCallback((next: CarouselApi) => {
    setApi(next);
    setIndex(next.selectedScrollSnap());
  }, []);

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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-4 py-6 outline-none backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
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
            <div role="status" className="flex w-72 flex-col items-center rounded-2xl bg-white px-6 py-8 text-center shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f4f5]">
                <QrCode className="h-7 w-7 text-[#71717a]" />
              </div>
              <p className="mt-4 text-base font-semibold text-[#18181b]">No cards yet</p>
              <p className="mt-1 text-sm text-[#71717a]">Tap + to add your first store card</p>
            </div>
          ) : (
            <Carousel orientation="vertical" setApi={handleApi} className="h-[min(38rem,calc(100dvh-12rem))] w-[min(24rem,100%)]">
              <CarouselContent>
                {cards.map((card) => (
                  <CarouselItem key={card.id} className="flex items-center py-1">
                    <QrCardItem
                      card={card}
                      mode={mode}
                      onModeChange={setMode}
                      onEdit={() => setForm({ card })}
                      onDelete={() => remove(card.id)}
                    />
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
