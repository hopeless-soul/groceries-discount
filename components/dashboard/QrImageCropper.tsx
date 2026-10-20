"use client";

import { useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { cropToBlob } from "@/lib/qr/crop";
import { decodeImageBlob } from "@/lib/qr/decode";

interface QrImageCropperProps {
  imageSrc: string;
  onBack: () => void;
  onConfirm: (value: string) => void;
}

export function QrImageCropper({ imageSrc, onBack, onConfirm }: QrImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;
    setBusy(true);
    setError("");
    try {
      const area = completed?.width
        ? completed
        : { x: 0, y: 0, width: img.width, height: img.height };
      onConfirm(await decodeImageBlob(await cropToBlob(img, area)));
    } catch {
      setError("Could not read a QR code or barcode. Adjust the crop and try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-[#71717a]">Frame only the QR code or barcode.</p>
      <div className="mt-2 flex max-h-72 justify-center overflow-auto rounded-lg bg-[#27272a]">
        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompleted(c)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={imageSrc} alt="Uploaded code" className="max-h-72 w-auto" />
        </ReactCrop>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-[#dc2626]">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" className="h-10 flex-1" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button type="button" className="h-10 flex-1" onClick={handleConfirm} disabled={busy}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
