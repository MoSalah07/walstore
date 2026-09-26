import { getTranslations } from "next-intl/server";

import { getProductCategories } from "@/actions/admin-product.action";
import ProductForm from "../product-form";

export async function generateMetadata() {
  const t = await getTranslations("AdminProducts");
  return { title: t("New product") };
}

export default async function NewProductPage() {
  const categories = await getProductCategories();
  return <ProductForm categories={categories} />;
}
