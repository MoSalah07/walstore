import { IUserInput } from "@/interfaces/user.type";
import { Document, Model, model, models, Schema } from "mongoose";

export interface IUserAddress {
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface IUser extends Document, Omit<IUserInput, "address"> {
  _id: string;
  addresses: IUserAddress[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    password: { type: String },
    image: { type: String },
    // Saved at checkout; the first one flagged isDefault prefills the form.
    addresses: [
      {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        province: String,
        postalCode: String,
        country: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

const User = (models.User as Model<IUser>) || model<IUser>("User", userSchema);

export default User;
