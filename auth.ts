/* eslint-disable @typescript-eslint/no-explicit-any */
import connectToDatabase from "@/lib/connect.db";
import bcrypt from "bcryptjs";

import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth.config";
import User from "./models/user.model";

// تعريف Session و User في NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
  }
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  // Self-hosted (next start / Docker): trust the incoming Host header.
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
    // error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await connectToDatabase();
          const user = await User.findOne({
            email: String(credentials.email).toLowerCase(),
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordCorrect) {
            return null;
          }

          // Deactivated accounts cannot sign in.
          if (user.isActive === false) return null;
          await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: (user.role || "user").toLowerCase(),
          };
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name || user.email?.split("@")[0];
        token.role = (user as any).role ?? "user";
        // Sign-in time; `iat` can't be used as it is renewed on every request.
        token.authAt = Date.now();
      }

      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      // Re-read role/name at most once a minute so admin changes (role,
      // deactivation, deletion) apply without waiting for the token to expire.
      const checked = Number(token.checkedAt ?? 0);
      if (!user && token.sub && Date.now() - checked > 60_000) {
        try {
          await connectToDatabase();
          const fresh = await User.findById(token.sub).select("name role isActive passwordChangedAt").lean();
          if (!fresh || fresh.isActive === false) return null;
          // Password was reset after this session started.
          if (fresh.passwordChangedAt && fresh.passwordChangedAt.getTime() > Number(token.authAt ?? 0)) return null;
          token.role = fresh.role ?? "user";
          token.name = fresh.name;
          token.checkedAt = Date.now();
        } catch {
          // Keep the current token if the database is briefly unavailable.
        }
      }

      return token;
    },

    async session({ session, token, user, trigger }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.name = token.name;
      }

      if (trigger === "update" && user?.name) {
        session.user.name = user.name;
      }

      return session;
    },
  },
});
