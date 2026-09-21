import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  country: string | null;
  city: string | null;
  setLocation: (country: string, city: string) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      country: null,
      city: null,
      setLocation: (country, city) => set({ country, city }),
      clear: () => set({ country: null, city: null }),
    }),
    { name: "groceries-discount:location" },
  ),
);
