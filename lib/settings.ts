import "server-only";

import { DEFAULT_PRICING, PricingConfig } from "./pricing";

// Store-wide pricing settings (free-shipping threshold, shipping rates, tax).
// Backed by the admin Settings page; falls back to constants.
export async function getPricingConfig(): Promise<PricingConfig> {
  return DEFAULT_PRICING;
}
