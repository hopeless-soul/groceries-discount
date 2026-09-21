"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocationSelectCard } from "@/components/location/LocationSelectCard";
import { useLocationStore } from "@/lib/stores/location-store";

export default function Page() {
  const router = useRouter();
  const { country, city, setLocation } = useLocationStore();

  useEffect(() => {
    if (country && city) {
      router.replace("/dashboard");
    }
  }, [country, city, router]);

  if (country && city) {
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
