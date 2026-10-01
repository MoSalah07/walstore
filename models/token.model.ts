import { model, models, Schema, Model, Types } from "mongoose";

export type TokenKind = "reset-password" | "verify-email";

// One-time links sent by email. Only a SHA-256 hash of the token is stored,
// so a database leak can't be used to reset passwords. Expired tokens are
// removed by MongoDB's TTL monitor.
export interface IToken {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  kind: TokenKind;
  hash: string;
  email: string; // the address the link was sent to
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["reset-password", "verify-email"], required: true },
    hash: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Token = (models.Token as Model<IToken>) || model<IToken>("Token", tokenSchema);
export default Token;
