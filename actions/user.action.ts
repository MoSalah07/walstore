"use server";
import { signIn, signOut } from "@/auth";
import { IUserSignIn, IUserSignUp } from "@/interfaces/user.type";
import { UserSignUpSchema } from "@/interfaces/validator/validator";

import connectToDatabase from "@/lib/connect.db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
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
    const existingUser = await User.findOne({ email: userSignUp.email });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }
    await User.create({
      ...user,
      password: await bcrypt.hash(userSignUp.password, 5),
    });
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

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn("credentials", {
    ...user,
    redirect: false,
  });
}

export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false });
  redirect(redirectTo.redirect);
};
