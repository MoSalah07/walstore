import { create } from "zustand";
import { persist } from "zustand/middleware";

type StoreState = {
  currency: "EUR" | "USD" | "EGP";
  setCurrency: (currency: "EUR" | "USD" | "EGP") => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currency: "USD",
      setCurrency: (currency: "EUR" | "USD" | "EGP") => set({ currency }),
    }),
    {
      name: "currency",
    }
  )
);
