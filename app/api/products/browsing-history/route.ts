import connectToDatabase from "@/lib/connect.db";
import { Types } from "mongoose";
import Product from "@/models/product.model";
import { NextResponse, NextRequest } from "next/server";
import { IProduct } from "@/interfaces/product.interface";

export async function GET(req: NextRequest) {
  try {
    const listType = req.nextUrl.searchParams.get("type") || "history";
    const productIdParam = req.nextUrl.searchParams.get("ids");
    const categoriesParam = req.nextUrl.searchParams.get("categories");

    if (!productIdParam || !categoriesParam) {
      return NextResponse.json(
        { message: "Missing query parameters" },
        { status: 400 }
      );
    }
    const productIds = productIdParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const categories = categoriesParam
      .split(",")
      .map((cat) => cat.trim())
      .filter(Boolean);

    if (!productIds.length || !categories.length) {
      return NextResponse.json(
        { message: "Invalid product IDs or categories" },
        { status: 400 }
      );
    }
    await connectToDatabase();
    const filter =
      listType === "history"
        ? { _id: { $in: productIds } }
        : { category: { $in: categories }, _id: { $nin: productIds } };

    const products = await Product.find(filter).lean<IProduct[]>();

    if (!products || products.length === 0) {
      return NextResponse.json([]);
    }
    if (listType === "history") {
      const sorted = productIds
        .map((id) => products.find((p) => p._id.toString() === id.toString()))
        .filter(Boolean);
      return NextResponse.json(sorted);
    }
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
