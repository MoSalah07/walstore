import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";

import Token, { TokenKind } from "@/models/token.model";

const TTL: Record<TokenKind, number> = {
  "reset-password": 60 * 60 * 1000, // 1 hour
  "verify-email": 48 * 60 * 60 * 1000, // 2 days
};

// Don't send the same kind of email to one account more than once a minute.
const RESEND_AFTER = 60 * 1000;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// A new link replaces any older one of the same kind. Returns null when the
// last link went out less than a minute ago. Expects an open connection.
export async function issueToken(userId: string | Types.ObjectId, email: string, kind: TokenKind) {
  const recent = await Token.exists({ user: userId, kind, createdAt: { $gt: new Date(Date.now() - RESEND_AFTER) } });
  if (recent) return null;
  await Token.deleteMany({ user: userId, kind });
  const token = randomBytes(32).toString("base64url");
  await Token.create({ user: userId, kind, email, hash: hash(token), expiresAt: new Date(Date.now() + TTL[kind]) });
  return token;
}

// The token's record if it is valid, without using it up.
export async function findToken(token: string, kind: TokenKind) {
  if (!token || token.length > 100) return null;
  return Token.findOne({ hash: hash(token), kind, expiresAt: { $gt: new Date() } }).lean();
}

// Uses the token up; only one caller can win it.
export async function consumeToken(token: string, kind: TokenKind) {
  if (!token || token.length > 100) return null;
  return Token.findOneAndDelete({ hash: hash(token), kind, expiresAt: { $gt: new Date() } }).lean();
}
