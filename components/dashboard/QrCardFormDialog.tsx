"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { CircleCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shopConfigs, shopKeys, type ShopKey } from "@/lib/config/shops";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import { defaultCardName, useQrCardsStore, type QrCard } from "@/lib/stores/qr-cards-store";
import { QrImageCropper } from "./QrImageCropper";

interface QrCardFormDialogProps {
  card: QrCard | null;
  onClose: () => void;
}

export function QrCardFormDialog({ card, onClose }: QrCardFormDialogProps) {
  const cards = useQrCardsStore((s) => s.cards);
  const add = useQrCardsStore((s) => s.add);
  const update = useQrCardsStore((s) => s.update);
  const selectedStore = useDashboardUiStore((s) => s.selectedStore);

  const initialShop = card?.shop ?? selectedStore;
  const [shop, setShop] = useState<ShopKey>(initialShop);
  const [name, setName] = useState(card?.name ?? defaultCardName(initialShop, cards));
  const [nameEdited, setNameEdited] = useState(card !== null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "crop">("form");
  const [error, setError] = useState("");

  // Revokes the previous object URL whenever the image changes and on unmount.
  useEffect(
    () => () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    },
    [imageSrc],
  );

  function handleShop(value: string | null) {
    if (!value) return;
    const next = value as ShopKey;
    setShop(next);
    if (!nameEdited) setName(defaultCardName(next, cards));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageSrc(null);
      setError("Choose an image file.");
      return;
    }
    setError("");
    setImageSrc(URL.createObjectURL(file));
    setStep("crop");
  }

  function handleSave() {
    const finalName = name.trim() || defaultCardName(shop, cards);
    setName(finalName);
    if (!imageSrc) {
      if (!card) {
        setError("Choose an image of the code.");
        return;
      }
      update(card.id, { shop, name: finalName });
      onClose();
      return;
    }
    setError("");
    setStep("crop");
  }

  function handleConfirm(value: string) {
    if (card) update(card.id, { shop, name, value });
    else add({ shop, name, value });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-0 p-5 shadow-xl">
        <DialogPrimitive.Title className="text-base font-semibold text-[#18181b]">
          {card ? "Edit card" : "New card"}
        </DialogPrimitive.Title>

        {step === "form" ? (
          <div className="mt-3 space-y-3 text-[#18181b]">
            <div>
              <div className="mb-1 text-xs font-medium">Store</div>
              <Select value={shop} onValueChange={handleShop}>
                <SelectTrigger aria-label="Store" className="h-10 w-full text-base">
                  <SelectValue>{(value: ShopKey) => shopConfigs[value].name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {shopKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {shopConfigs[key].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="qr-card-name" className="mb-1 block text-xs font-medium">
                Name
              </label>
              <Input
                id="qr-card-name"
                className="h-10 text-base"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameEdited(true);
                }}
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium">Code image</div>
              <input
                id="qr-card-image"
                aria-label="QR / barcode image"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="peer sr-only"
              />
              <label
                htmlFor="qr-card-image"
                className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#d4d4d8] text-sm text-[#71717a] transition-colors hover:border-[#a1a1aa] hover:bg-[#fafafa] peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
              >
                {imageSrc ? <CircleCheck className="h-5 w-5 text-[#15803d]" /> : <Upload className="h-5 w-5" />}
                <span>{imageSrc ? "Image selected, tap to replace" : "Tap to upload a photo or screenshot"}</span>
              </label>
              {!imageSrc && card && <p className="mt-1 text-xs text-[#71717a]">Leave empty to keep the current code.</p>}
            </div>

            {error && (
              <p role="alert" className="text-xs text-[#dc2626]">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="h-10 flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" className="h-10 flex-1" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <QrImageCropper imageSrc={imageSrc!} onBack={() => setStep("form")} onConfirm={handleConfirm} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
