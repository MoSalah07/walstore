import { model, models, Schema } from "mongoose";
import { IProduct } from "@/interfaces/product.interface";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, required: true, default: false },
    price: { type: Number, required: true },
    listPrice: { type: Number, required: true, default: 0 },
    brand: { type: String, required: true },
    numSales: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true },
    description: { type: String, trim: true },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Product = models.Product || model<IProduct>("Product", productSchema);

export default Product;
