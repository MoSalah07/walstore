import { BRAND_ATTRIBUTE } from "./brand";

// Runtime access to the colour tokens in app/globals.css, for code that
// can't use Tailwind classes (canvas, WebGL).

export type Rgb = readonly [r: number, g: number, b: number];

// Reads a token stored as "R G B" channels, e.g. readRgbToken("primary").
export function readRgbToken(name: string, el: Element = document.documentElement): Rgb | null {
  const raw = getComputedStyle(el).getPropertyValue(`--${name}`).trim();
  const channels = raw.split(/\s+/).map(Number);
  if (channels.length !== 3 || channels.some((c) => !Number.isFinite(c))) return null;
  return [channels[0], channels[1], channels[2]];
}

// Fires when the colour mode (`class`) or brand changes on <html>.
export function onThemeChange(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", BRAND_ATTRIBUTE],
  });
  return () => observer.disconnect();
}
