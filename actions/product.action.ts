"use server";
import {
  IProduct,
  IProductResForCard,
  ProductTags,
} from "@/interfaces/product.interface";
import connectToDatabase from "@/lib/connect.db";
import Product from "@/models/product.model";

// GET Product For Cards
export const getProductsForCard = async ({
  tag = ProductTags["new-arrival"],
  limit = 4,
}: {
  tag: ProductTags;
  limit?: number;
}): Promise<IProductResForCard[]> => {
  try {
    await connectToDatabase();
    const product = await Product.aggregate<IProductResForCard>([
      {
        $match: {
          tags: { $in: [tag] },
          isPublished: true,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          name: true,
          href: { $concat: [`/product/`, "$slug"] },
          image: { $arrayElemAt: ["$images", 0] },
        },
      },
    ]);
    return product;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getProductByTag = async ({
  tag,
  limit = 10,
}: {
  tag: ProductTags;
  limit?: number;
}): Promise<IProduct[]> => {
  try {
    await connectToDatabase();
    const product = await Product.aggregate<IProduct>([
      { $match: { tags: { $in: [tag] }, isPublished: true } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);
    return JSON.parse(JSON.stringify(product));
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getProductBySlug = async (
  slug: string
): Promise<IProduct | null> => {
  try {
    if (!slug) return null;
    await connectToDatabase();
    const product = await Product.findOne({ slug, isPublished: true });
    return product as IProduct;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getRelatedProductsByCategory = async ({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string;
  productId: string;
  limit?: number;
  page: number;
}): Promise<{
  data: IProduct[];
  totalPages: number;
} | null> => {
  try {
    if (!category || !productId) return null;
    await connectToDatabase();
    const skipAmount = (Number(page) - 1) * limit;
    const conditions = {
      category,
      isPublished: true,
      _id: { $ne: productId },
    };
    const product = await Product.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const productCount = await Product.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(product)) as IProduct[],
      totalPages: Math.ceil(productCount / limit),
    };
  } catch (err) {
    console.log(err);
    return null;
  }
};
