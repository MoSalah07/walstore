import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getAdminProduct, getProductCategories } from "@/actions/admin-product.action";
import ProductForm from "../product-form";

export async function generateMetadata() {
  const t = await getTranslations("AdminProducts");
  return { title: t("Edit product") };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(id), getProductCategories()]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} />;
}
