"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocationSelectCard } from "@/components/location/LocationSelectCard";
import { useLocationStore } from "@/lib/stores/location-store";
import { useHasHydrated } from "@/hooks/useHasHydrated";

export default function Page() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const { country, city, setLocation } = useLocationStore();

  useEffect(() => {
    if (hasHydrated && country && city) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, country, city, router]);

  if (!hasHydrated || (country && city)) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#fafafa] p-6">
      <LocationSelectCard
        onSubmit={(selectedCountry, selectedCity) => {
          setLocation(selectedCountry, selectedCity);
          router.replace("/dashboard");
        }}
      />
    </div>
  );
}
