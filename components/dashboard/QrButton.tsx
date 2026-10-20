"use client";

import { QrCode } from "lucide-react";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

export function QrButton() {
  const toggleQrOpen = useDashboardUiStore((s) => s.toggleQrOpen);

  return (
    <button
      type="button"
      aria-label="Show QR code"
      onClick={toggleQrOpen}
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#18181b] text-white shadow-lg"
    >
      <QrCode className="h-5 w-5" />
    </button>
  );
}
