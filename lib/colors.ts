// Swatch colors for product color names stored in the catalogue.
const SWATCHES: Record<string, string> = {
  black: "#1B1C1F",
  white: "#FFFFFF",
  grey: "#8A8F98",
  gray: "#8A8F98",
  silver: "#C9CCD1",
  blue: "#2B4C8C",
  navy: "#1F2A44",
  green: "#3F6B4A",
  red: "#B3261E",
  yellow: "#E8C547",
  brown: "#7A4E2D",
  beige: "#D9C8A9",
};

export const swatchFor = (name: string) => SWATCHES[name.toLowerCase()] ?? "#D0D5DD";
