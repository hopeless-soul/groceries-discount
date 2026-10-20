"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { OfferCard } from "@/components/dashboard/OfferCard";
import type { DisplayOffer } from "@/lib/types";

interface OfferPreviewDialogProps {
  offer: DisplayOffer;
  /** What opens the popup on click. */
  children: ReactNode;
  /** Trigger button layout. */
  className?: string;
}

export function OfferPreviewDialog({ offer, children, className = "block w-full" }: OfferPreviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger aria-label="Preview image" className={`cursor-zoom-in ${className}`}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[min(640px,calc(100vw-32px))] border-0">
        <OfferCard offer={offer} preview />
      </DialogContent>
    </Dialog>
  );
}
