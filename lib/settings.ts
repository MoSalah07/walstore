import "server-only";
import { cache } from "react";

import { FREE_SHIPPING_MIN_PRICE, SHIPPING_RATES, TAX_RATE, WEBSITE_NAME } from "@/constants";
import connectToDatabase from "./connect.db";
import { PricingConfig } from "./pricing";
import Settings from "@/models/settings.model";

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  pricing: PricingConfig;
};

const DEFAULTS: StoreSettings = {
  storeName: WEBSITE_NAME,
  supportEmail: "",
  supportPhone: "",
  pricing: {
    freeShippingMin: FREE_SHIPPING_MIN_PRICE,
    standard: SHIPPING_RATES.standard,
    express: SHIPPING_RATES.express,
    taxRate: TAX_RATE,
  },
};

// Store settings from the admin Settings page, read once per request.
// Falls back to the constants if the database is unreachable.
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  try {
    await connectToDatabase();
    const s = await Settings.findById("store").lean();
    if (!s) return DEFAULTS;
    return {
      storeName: s.storeName || DEFAULTS.storeName,
      supportEmail: s.supportEmail ?? "",
      supportPhone: s.supportPhone ?? "",
      pricing: {
        freeShippingMin: s.freeShippingMin,
        standard: s.standardShipping,
        express: s.expressShipping,
        taxRate: s.taxRate,
      },
    };
  } catch {
    return DEFAULTS;
  }
});

export async function getPricingConfig(): Promise<PricingConfig> {
  return (await getStoreSettings()).pricing;
}
