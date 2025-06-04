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

export async function getAllCategories() {
  await connectToDatabase();
  const categories = await Product.find({ isPublished: true }).distinct(
    "category"
  );
  return categories;
}

// GET ALL PRODUCTS
export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query: string;
  category: string;
  tag: string;
  limit?: number;
  page: number;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  const pageSize = 9;
  limit = limit || pageSize;
  await connectToDatabase();

  const queryFilter =
    query && query !== "all"
      ? {
          name: {
            $regex: query,
            $options: "i",
          },
        }
      : {};
  const categoryFilter = category && category !== "all" ? { category } : {};
  const tagFilter = tag && tag !== "all" ? { tags: tag } : {};

  const ratingFilter =
    rating && rating !== "all"
      ? {
          avgRating: {
            $gte: Number(rating),
          },
        }
      : {};
  // 10-50
  const priceFilter =
    price && price !== "all"
      ? {
          price: {
            $gte: Number(price.split("-")[0]),
            $lte: Number(price.split("-")[1]),
          },
        }
      : {};
  const order: Record<string, 1 | -1> =
    sort === "best-selling"
      ? { numSales: -1 }
      : sort === "price-low-to-high"
      ? { price: 1 }
      : sort === "price-high-to-low"
      ? { price: -1 }
      : sort === "avg-customer-review"
      ? { avgRating: -1 }
      : { _id: -1 };
  const isPublished = { isPublished: true };
  const products = await Product.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean();

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  });
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
  };
}

export async function getAllTags() {
  const tags = await Product.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: null, uniqueTags: { $addToSet: "$tags" } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ]);
  return (
    (tags[0]?.uniqueTags
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      ) as string[]) || []
  );
}
