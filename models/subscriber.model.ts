import { model, models, Schema, Model } from "mongoose";

export interface ISubscriber {
  email: string;
  locale: string;
  createdAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    locale: { type: String, default: "en" },
  },
  { timestamps: true }
);

const Subscriber =
  (models.Subscriber as Model<ISubscriber>) ||
  model<ISubscriber>("Subscriber", subscriberSchema);

export default Subscriber;
