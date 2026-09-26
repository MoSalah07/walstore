import bcrypt from "bcryptjs";

import connectToDatabase from "./connect.db";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { products } from "@/constants/data";

// Demo accounts are only created when missing — existing users are untouched.
const demoUsers = [
  { name: "Admin", email: "admin@example.com", role: "admin", password: "123456" },
  { name: "John Doe", email: "john@me.com", role: "user", password: "Password123" },
];

async function seed() {
  try {
    await connectToDatabase();
    await Product.deleteMany({});
    await Product.insertMany(products);
    for (const u of demoUsers) {
      const exists = await User.exists({ email: u.email });
      if (!exists) {
        await User.create({ ...u, password: await bcrypt.hash(u.password, 10) });
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
