import { model, models, Schema, Model, Types } from "mongoose";

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// Customer reviews; only approved ones show on product pages.
export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  userName: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  reply?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: REVIEW_STATUSES, default: "pending", index: true },
    verifiedPurchase: { type: Boolean, default: false },
    reply: { type: String, maxlength: 1000 },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: Date,
  },
  { timestamps: true }
);
// One review per customer per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = (models.Review as Model<IReview>) || model<IReview>("Review", reviewSchema);
export default Review;
