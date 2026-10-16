"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityAutocomplete } from "@/components/location/CityAutocomplete";
import { COUNTRIES } from "@/lib/locations";
import BascetLogo from '@/public/bascet_logo.svg';

interface LocationSelectCardProps {
  onSubmit: (country: string, city: string) => void;
  initialCountry?: string | null;
  initialCity?: string | null;
}

export function LocationSelectCard({
  onSubmit,
  initialCountry = null,
  initialCity = null,
}: LocationSelectCardProps) {
  const [country, setCountry] = useState<string | null>(initialCountry);
  const [city, setCity] = useState<string | null>(initialCity);

  const canContinue = Boolean(country && city);

  return (
    <div className="w-full max-w-100 rounded-xl border border-[#e4e4e7] bg-white p-7 shadow-sm flex flex-col gap-[18px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#18181b] text-white">
          <BascetLogo aria-hidden="true" className="h-[24] w-[24] text-white" />
        </div>
        <h1 className="text-xl font-semibold">Basket</h1>
        <p className="text-sm text-[#71717a]">Find current grocery discounts near you.</p>
      </div>

      <Select
        value={country ?? undefined}
        onValueChange={(value) => {
          setCountry(value);
          setCity(null);
        }}
      >
        <SelectTrigger aria-label="Country">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CityAutocomplete countryCode={country} value={city} onChange={setCity} />

      <Button
        className="w-full"
        disabled={!canContinue}
        onClick={() => onSubmit(country as string, city as string)}
      >
        Continue
      </Button>
    </div>
  );
}
