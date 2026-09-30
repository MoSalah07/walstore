import { model, models, Schema, Model, Types } from "mongoose";

export type ActivityEntity = "order" | "product" | "user" | "review" | "promo" | "settings";

// Audit log: who did what to which record, with an optional before → after.
export interface IActivity {
  _id: Types.ObjectId;
  actor?: Types.ObjectId;
  actorName: string;
  action: string;
  entity: ActivityEntity;
  entityId?: string;
  entityLabel?: string;
  diff?: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, enum: ["order", "product", "user", "review", "promo", "settings"], required: true, index: true },
    entityId: String,
    entityLabel: String,
    diff: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
activitySchema.index({ createdAt: -1 });

const Activity = (models.Activity as Model<IActivity>) || model<IActivity>("Activity", activitySchema);
export default Activity;
