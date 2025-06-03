import { formatNumberWithDecimal } from "@/lib/utils";
import { z } from "zod";

// User
const MongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid MongoDB ID" });

const Price = (field: string) =>
  z.coerce
    .number()
    .refine(
      (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(value)),
      `${field} must have exactly two decimal places (e.g., 49.99)`
    );

const UserName = z
  .string()
  .min(2, { message: "Username must be at least 2 characters" })
  .max(40, { message: "Username must be at most 40 characters" });

const Email = z
  .string()
  .min(1, { message: "Email is required" })
  .email({ message: "Invalid email address" });

const Password = z
  .string()
  .min(3, { message: "Password must be at least 3 characters" });

const UserRole = z.string().min(1, { message: "Role is required" });

export const UserUpdateSchema = z.object({
  _id: MongoId,
  name: UserName,
  email: Email,
  role: UserRole,
});

export const UserInputSchema = z.object({
  name: UserName,
  email: Email,
  image: z.string().optional(),
  emailVerified: z.boolean(),
  role: UserRole,
  password: Password,
  paymentMethod: z.string().min(1, "Payment method is required"),
  address: z.object({
    fullName: z.string().min(1, "Full name is required"),
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().min(1, "Phone number is required"),
  }),
});

export const UserSignInSchema = z.object({
  email: Email,
  password: Password,
});

export const UserSignUpSchema = UserSignInSchema.extend({
  name: UserName,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Order
export const OrderItemsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  product: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Product slug is required"),
  image: z.string().min(1, "Product image is required"),
  price: Price("Price"),
  quantity: z
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative number"),
  countInStock: z
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative number"),
  size: z.string().optional(),
  color: z.string().optional(),
  category: z.string().min(1, "Product category is required"),
});

// Cart
export const CartSchema = z.object({
  items: z
    .array(OrderItemsSchema)
    .min(1, "Order must contain at least on item"),
});
