import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearFetchCache } from "@/lib/cache/fetchCache";

interface LocationState {
  country: string | null;
  city: string | null;
  setLocation: (country: string, city: string) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      country: null,
      city: null,
      setLocation: (country, city) => {
        const current = get();
        if (current.country !== country || current.city !== city) {
          clearFetchCache();
        }
        set({ country, city });
      },
      clear: () => set({ country: null, city: null }),
    }),
    { name: "groceries-discount:location" },
  ),
);
