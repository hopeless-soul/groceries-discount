"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, getCitiesForCountry } from "@/lib/locations";

interface LocationSelectCardProps {
  onSubmit: (country: string, city: string) => void;
}

export function LocationSelectCard({ onSubmit }: LocationSelectCardProps) {
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const cities = country ? getCitiesForCountry(country) : [];
  const canContinue = Boolean(country && city);

  return (
    <div className="w-full max-w-[400px] rounded-xl border border-[#e4e4e7] bg-white p-7 shadow-sm flex flex-col gap-[18px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#18181b] text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
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

      <Select value={city ?? undefined} onValueChange={setCity} disabled={!country}>
        <SelectTrigger aria-label="City">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
