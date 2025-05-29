import connectToDatabase from "./connect.db";
import Product from "@/models/product.model";
import { products } from "@/constants/data";

async function seed() {
  try {
    await connectToDatabase();
    await Product.deleteMany({});
    await Product.insertMany(products);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
