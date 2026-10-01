import { model, models, Schema, Model, Types } from "mongoose";

export const ORDER_STATUSES = ["unpaid", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_METHODS = ["cod", "card", "paypal"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  category: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  shippingMethod: "standard" | "express";
  paymentMethod: PaymentMethod;
  itemsPrice: number;
  discountPrice: number;
  promo?: { code: string; kind: "percent" | "fixed"; value: number };
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  status: OrderStatus;
  isPaid: boolean;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  note?: string;
  locale?: string; // language the customer ordered in, for emails
  history: { status: OrderStatus | "paid" | "note"; at: Date; by?: Types.ObjectId; note?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: String,
        color: String,
      },
    ],
    shippingAddress: { type: addressSchema, required: true },
    shippingMethod: { type: String, enum: ["standard", "express"], default: "standard" },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    itemsPrice: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    promo: {
      type: new Schema({ code: String, kind: String, value: Number }, { _id: false }),
      default: undefined,
    },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "processing", index: true },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    note: String,
    locale: String,
    history: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        note: String,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ "promo.code": 1, user: 1 });

const Order = (models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);

export default Order;
