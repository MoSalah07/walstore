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
      }

      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
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
