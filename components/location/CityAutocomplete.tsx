"use client";

import { useEffect, useRef, useState } from "react";
import { searchCities } from "@/lib/actions/searchCities";

interface CityAutocompleteProps {
  countryCode: string | null;
  value: string | null;
  onChange: (city: string | null) => void;
}

export function CityAutocomplete({ countryCode, value, onChange }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!countryCode || query.trim().length < 2 || query === value) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    debounceRef.current = setTimeout(() => {
      searchCities(query, countryCode).then((results) => {
        if (!cancelled) {
          setSuggestions(results);
          setOpen(true);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, countryCode, value]);

  function selectCity(city: string) {
    onChange(city);
    setQuery(city);
    setSuggestions([]);
    setOpen(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    setOpen(true);
    if (value !== null) {
      onChange(null);
    }
  }

  const showSuggestions = open && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-label="City"
        aria-expanded={showSuggestions}
        aria-controls="city-suggestions"
        aria-autocomplete="list"
        autoComplete="off"
        disabled={!countryCode}
        placeholder="City"
        value={query}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {showSuggestions && (
        <ul
          id="city-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                role="option"
                aria-selected={city === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCity(city)}
                className="w-full px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
