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

// New passwords: 8+ characters with a letter and a number.
const Password = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Za-z]/, { message: "Password must include a letter" })
  .regex(/\d/, { message: "Password must include a number" });

// Signing in only needs something typed: older accounts may predate the rule.
const PasswordSignIn = z.string().min(1, { message: "Password is required" });

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
  password: PasswordSignIn,
});

export const UserSignUpSchema = z
  .object({
    email: Email,
    password: Password,
    name: UserName,
    confirmPassword: z.string().min(1, { message: "Confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
  itemsPrice: z.number(),
});

// Checkout
export const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(80),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[+\d][\d\s-]{6,19}$/, "Enter a valid phone number"),
  street: z.string().trim().min(1, "Street is required").max(120),
  city: z.string().trim().min(1, "City is required").max(60),
  province: z.string().trim().min(1, "Province is required").max(60),
  postalCode: z.string().trim().min(1, "Postal code is required").max(12),
  country: z.string().trim().min(1, "Country is required"),
});

export const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        product: MongoId,
        quantity: z.number().int().min(1).max(99),
        size: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .min(1, "Order must contain at least on item"),
  shippingAddress: ShippingAddressSchema,
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["cod"]),
  saveAddress: z.boolean().optional(),
});

// Admin product form
export const ProductInputSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(200),
    slug: z
      .string()
      .trim()
      .min(3, "Slug must be at least 3 characters")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
    category: z.string().trim().min(1, "Category is required"),
    brand: z.string().trim().min(1, "Brand is required"),
    description: z.string().trim().min(1, "Description is required").max(4000),
    images: z.array(z.string().min(1)).min(1, "Add at least one image").max(8),
    price: Price("Price").refine((v) => v > 0, "Price must be more than 0"),
    listPrice: Price("List price").refine((v) => v >= 0, "List price can't be negative"),
    countInStock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
    sizes: z.array(z.string().trim().min(1)).max(20),
    colors: z.array(z.string().trim().min(1)).max(20),
    tags: z.array(z.enum(["new-arrival", "best-seller", "todays-deal", "featured"])),
    isPublished: z.boolean(),
  })
  .refine((d) => d.listPrice === 0 || d.listPrice >= d.price, {
    message: "List price must be 0 or at least the price",
    path: ["listPrice"],
  });

// Admin user form
export const AdminUserSchema = z.object({
  name: UserName,
  email: Email,
  role: z.enum(["user", "admin"]),
});
