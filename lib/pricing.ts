import { FREE_SHIPPING_MIN_PRICE, SHIPPING_RATES, TAX_RATE } from "@/constants";
import { round2 } from "./utils";

export type ShippingMethod = "standard" | "express";

export type PricingConfig = {
  freeShippingMin: number;
  standard: number;
  express: number;
  taxRate: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  freeShippingMin: FREE_SHIPPING_MIN_PRICE,
  standard: SHIPPING_RATES.standard,
  express: SHIPPING_RATES.express,
  taxRate: TAX_RATE,
};

// Standard shipping is free over the threshold; express always costs extra.
export function calcPrices(
  items: { price: number; quantity: number }[],
  method: ShippingMethod = "standard",
  cfg: PricingConfig = DEFAULT_PRICING
) {
  const itemsPrice = round2(items.reduce((a, i) => a + i.price * i.quantity, 0));
  const freeShipping = itemsPrice >= cfg.freeShippingMin;
  const shippingPrice =
    items.length === 0 ? 0 : method === "express" ? cfg.express : freeShipping ? 0 : cfg.standard;
  const taxPrice = round2(itemsPrice * cfg.taxRate);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
  return {
    itemsPrice,
    shippingPrice: round2(shippingPrice),
    taxPrice,
    totalPrice,
    freeShipping,
    remainingForFree: round2(Math.max(0, cfg.freeShippingMin - itemsPrice)),
    progress: Math.min(1, itemsPrice / cfg.freeShippingMin),
  };
}
