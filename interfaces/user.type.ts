import { z } from "zod";
import {
  UserInputSchema,
  UserSignInSchema,
  UserSignUpSchema,
} from "./validator/validator";

export type IUserInput = z.infer<typeof UserInputSchema>;
export type IUserSignIn = z.infer<typeof UserSignInSchema>;
export type IUserSignUp = z.infer<typeof UserSignUpSchema>;

export enum UserRole {
  CUSTOMER = "Customer",
  SELLER = "Seller",
  ADMIN = "Admin",
  OWNER = "OWNER",
}
