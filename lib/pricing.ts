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

export type PromoKind = "percent" | "fixed";

// What a promo code takes off; `value` is a percent (10 = 10%) or an amount.
export type PromoRule = { kind: PromoKind; value: number; maxDiscount?: number | null };

// Promo codes discount the items only, never shipping, and never below zero.
export function calcDiscount(itemsPrice: number, promo?: PromoRule | null) {
  if (!promo || itemsPrice <= 0) return 0;
  let off = promo.kind === "percent" ? (itemsPrice * promo.value) / 100 : promo.value;
  if (promo.kind === "percent" && promo.maxDiscount) off = Math.min(off, promo.maxDiscount);
  return round2(Math.min(itemsPrice, Math.max(0, off)));
}

// Standard shipping is free over the threshold (checked before any promo
// code); express always costs extra. Tax is on the items after the discount.
export function calcPrices(
  items: { price: number; quantity: number }[],
  method: ShippingMethod = "standard",
  cfg: PricingConfig = DEFAULT_PRICING,
  promo?: PromoRule | null
) {
  const itemsPrice = round2(items.reduce((a, i) => a + i.price * i.quantity, 0));
  const discountPrice = calcDiscount(itemsPrice, promo);
  const freeShipping = itemsPrice >= cfg.freeShippingMin;
  const shippingPrice =
    items.length === 0 ? 0 : method === "express" ? cfg.express : freeShipping ? 0 : cfg.standard;
  const taxPrice = round2((itemsPrice - discountPrice) * cfg.taxRate);
  const totalPrice = round2(itemsPrice - discountPrice + shippingPrice + taxPrice);
  return {
    itemsPrice,
    discountPrice,
    shippingPrice: round2(shippingPrice),
    taxPrice,
    totalPrice,
    freeShipping,
    remainingForFree: round2(Math.max(0, cfg.freeShippingMin - itemsPrice)),
    progress: Math.min(1, itemsPrice / cfg.freeShippingMin),
  };
}
