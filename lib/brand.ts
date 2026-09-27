// Brand colour themes. The palette for each lives in app/globals.css under
// `[data-brand="…"]`; this module only picks which one <html> carries.
// Colour mode (light/dark/system) is separate and handled by next-themes.

export const BRANDS = ["ink", "red", "blue"] as const;
export type Brand = (typeof BRANDS)[number];

export const DEFAULT_BRAND: Brand = "ink";
export const BRAND_ATTRIBUTE = "data-brand";
export const BRAND_STORAGE_KEY = "walstore-brand";

export const isBrand = (value: unknown): value is Brand => BRANDS.includes(value as Brand);

export const parseBrand = (value: unknown): Brand => (isBrand(value) ? value : DEFAULT_BRAND);

export function readBrand(): Brand {
  return parseBrand(document.documentElement.getAttribute(BRAND_ATTRIBUTE));
}

export function applyBrand(brand: Brand) {
  document.documentElement.setAttribute(BRAND_ATTRIBUTE, brand);
}

export function saveBrand(brand: Brand) {
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, brand);
  } catch {
    // Storage blocked (private mode): the choice lasts for this page only.
  }
}

// Inlined in <head> so the saved brand is on <html> before first paint.
export const brandInitScript = `(function(){try{var b=localStorage.getItem(${JSON.stringify(
  BRAND_STORAGE_KEY
)});if(${JSON.stringify(BRANDS)}.indexOf(b)<0)b=${JSON.stringify(
  DEFAULT_BRAND
)};document.documentElement.setAttribute(${JSON.stringify(BRAND_ATTRIBUTE)},b)}catch(e){}})()`;
