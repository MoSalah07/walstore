import { getProductByTag } from "@/actions/product.action";
import BrowsingHistoryList from "@/components/shared/browsing-history-list";
import { CarouselHome } from "@/components/shared/home/CarouselHome";
import ProductSlider from "@/components/shared/home/ProductSlider";
import TagsCardsHome from "@/components/shared/home/TagsCardsHome";
import { ProductTags } from "@/interfaces/product.interface";
import {
  createTagsCard,
  getAllTagsCardProduct,
} from "@/lib/helper/product.helper";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Home");
  const tagsCards = await getAllTagsCardProduct();
  const todayDelats = await getProductByTag({
    tag: ProductTags["todays-deal"],
  });

  const bestSellers = await getProductByTag({
    tag: ProductTags["best-seller"],
  });

  const cards = createTagsCard({
    items: [
      tagsCards[0].products,
      tagsCards[1].products,
      tagsCards[tagsCards.length - 1].products,
    ],
    title: [
      t("Explore New Arrivals"),
      t("Discover Best Sellers"),
      t("Featured Products"),
    ],
  });

  return (
    <>
      <CarouselHome />
      <TagsCardsHome cards={cards} />
      <ProductSlider products={todayDelats} title={t("Today's Deals")} />
      <ProductSlider
        products={bestSellers}
        title={t("Best Selling Products")}
        hideDetails
      />
      {/* <ProductSlider */}
      <div className="p-4 bg-background">
        <BrowsingHistoryList />
      </div>
    </>
  );
}
