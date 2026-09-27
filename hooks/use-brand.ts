"use client";

import { useSyncExternalStore } from "react";

import { applyBrand, Brand, BRAND_STORAGE_KEY, parseBrand, readBrand, saveBrand } from "@/lib/brand";
import { onThemeChange } from "@/lib/theme-tokens";

// <html data-brand> is the source of truth; this hook just mirrors it.
function subscribe(onChange: () => void) {
  const stopObserving = onThemeChange(onChange);
  // Keep other open tabs in step.
  const onStorage = (e: StorageEvent) => {
    if (e.key === BRAND_STORAGE_KEY) applyBrand(parseBrand(e.newValue));
  };
  window.addEventListener("storage", onStorage);
  return () => {
    stopObserving();
    window.removeEventListener("storage", onStorage);
  };
}

function setBrand(brand: Brand) {
  applyBrand(brand);
  saveBrand(brand);
}

// `brand` is undefined during SSR and hydration, like next-themes' `theme`.
export default function useBrand() {
  const brand = useSyncExternalStore<Brand | undefined>(subscribe, readBrand, () => undefined);
  return { brand, setBrand };
}
