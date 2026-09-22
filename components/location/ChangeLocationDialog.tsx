"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LocationSelectCard } from "@/components/location/LocationSelectCard";
import { useLocationStore } from "@/lib/stores/location-store";

interface ChangeLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeLocationDialog({ open, onOpenChange }: ChangeLocationDialogProps) {
  const router = useRouter();
  const country = useLocationStore((s) => s.country);
  const city = useLocationStore((s) => s.city);
  const setLocation = useLocationStore((s) => s.setLocation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LocationSelectCard
          initialCountry={country}
          initialCity={city}
          onSubmit={(selectedCountry, selectedCity) => {
            setLocation(selectedCountry, selectedCity);
            onOpenChange(false);
            router.replace("/dashboard");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
