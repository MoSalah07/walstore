import { Document, Types } from "mongoose";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  category: string;
  images: string[];
  tags: string[];
  isPublished: boolean;
  price: number;
  listPrice: number;
  brand: string;
  numSales: number;
  countInStock: number;
  description: string;
  sizes: string[];
  colors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductResForCard extends Document {
  _id: Types.ObjectId;
  name: string;
  href: string;
  image: string;
}

export enum ProductTags {
  "new-arrival" = "new-arrival",
  "best-seller" = "best-seller",
  "todays-deal" = "todays-deal",
  "featured" = "featured",
}
