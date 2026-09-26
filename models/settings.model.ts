import { model, models, Schema, Model } from "mongoose";

// Single document (_id "store") holding editable store settings.
export interface ISettings {
  _id: string;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingMin: number;
  standardShipping: number;
  expressShipping: number;
  taxRate: number; // 0.14 = 14%
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    _id: { type: String, default: "store" },
    storeName: { type: String, default: "WalStore" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    freeShippingMin: { type: Number, default: 300 },
    standardShipping: { type: Number, default: 9.99 },
    expressShipping: { type: Number, default: 19.99 },
    taxRate: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const Settings = (models.Settings as Model<ISettings>) || model<ISettings>("Settings", settingsSchema);
export default Settings;
