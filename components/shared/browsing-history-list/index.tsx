"use client";

import useBrowsingHistory from "@/store/use-browsing-history";
import useBrowsingHistoryStore from "@/store/use-browsing-history";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import ProductSlider from "../home/ProductSlider";
import Container from "../container";

export default function BrowsingHistoryList() {
  const { products } = useBrowsingHistoryStore();
  const t = useTranslations("Home");
  return (
    products.length !== 0 && (
      <Container>
        <div className="bg-background">
          <ProductList
            title={t("Related to items that you've viewed")}
            type="related"
          />
          <ProductList
            title={t("Your browsing history")}
            hideDetails
            type="history"
          />
        </div>
      </Container>
    )
  );
}

function ProductList({
  title,
  type = "history",
  hideDetails = false,
  excludeId = "",
}: {
  title: string;
  type: "history" | "related";
  excludeId?: string;
  hideDetails?: boolean;
}) {
  const { products } = useBrowsingHistory();
  const [data, setData] = React.useState([]);
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(
        `/api/products/browsing-history?type=${type}&excludeId=${excludeId}&categories=${products
          .map((product) => product.category)
          .join(",")}&ids=${products.map((product) => product.id).join(",")}`
      );
      const data = await res.json();
      setData(data);
    };
    fetchProducts();
  }, [excludeId, products, type]);

  return (
    data.length > 0 && (
      <ProductSlider title={title} products={data} hideDetails={hideDetails} />
    )
  );
}
