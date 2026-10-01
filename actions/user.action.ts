"use server";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { IUserSignIn, IUserSignUp } from "@/interfaces/user.type";
import { UserSignUpSchema } from "@/interfaces/validator/validator";

import connectToDatabase from "@/lib/connect.db";
import User from "@/models/user.model";
import { logActivity } from "@/lib/activity";
import { sendWelcomeVerification } from "@/lib/email-verification";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ZodError } from "zod";

// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    });
    await connectToDatabase();
    const existingUser = await User.findOne({ email: user.email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }
    const created = await User.create({
      name: user.name,
      email: user.email.toLowerCase(),
      role: "user",
      password: await bcrypt.hash(userSignUp.password, 10),
    });
    await logActivity({
      actor: { id: String(created._id), name: created.name },
      action: "created an account",
      entity: "user",
      entityId: String(created._id),
      entityLabel: created.email,
    });
    await sendWelcomeVerification(created);
    return { success: true, message: "User created successfully" };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: "Something went wrong, please try again later.",
    };
  }
}

export async function signInWithCredentials(
  user: IUserSignIn
): Promise<{ ok: boolean }> {
  try {
    await signIn("credentials", { ...user, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false };
    throw error;
  }
}

export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false });
  redirect(redirectTo.redirect);
};

// Signs out and lands on sign-in (used by "Switch account" on the 403 page).
export const SwitchAccount = async () => {
  const locale = await getLocale();
  await signOut({ redirectTo: `/${locale}/sign-in` });
};
