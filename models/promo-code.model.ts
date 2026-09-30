import { model, models, Schema, Model, Types } from "mongoose";

import type { PromoKind } from "@/lib/pricing";

export const PROMO_STATUSES = ["active", "scheduled", "expired", "used-up", "inactive"] as const;
export type PromoStatus = (typeof PROMO_STATUSES)[number];

// A code customers type at checkout. Codes are stored upper-case.
export interface IPromoCode {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  kind: PromoKind;
  value: number; // percent (10 = 10%) or a fixed amount
  maxDiscount?: number | null; // cap for percent codes
  minOrder: number; // items subtotal needed, 0 = none
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null; // total uses, empty = unlimited
  perUserLimit: number; // 0 = unlimited
  usedCount: number; // orders placed with it, minus cancelled ones
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    kind: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null },
    minOrder: { type: Number, default: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PromoCode =
  (models.PromoCode as Model<IPromoCode>) || model<IPromoCode>("PromoCode", promoCodeSchema);
export default PromoCode;
