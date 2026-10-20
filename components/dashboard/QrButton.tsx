"use client";

import { QrCode } from "lucide-react";

export function QrButton() {
  return (
    <button
      type="button"
      aria-label="Show QR code"
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#18181b] text-white shadow-lg"
    >
      <QrCode className="h-5 w-5" />
    </button>
  );
}
