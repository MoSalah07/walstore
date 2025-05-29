import { getProductsForCard } from "@/actions/product.action";
import {
  IProductResForCard,
  ProductTags,
} from "@/interfaces/product.interface";

export const getAllTagsCardProduct = async (): Promise<
  {
    tag: ProductTags;
    products: IProductResForCard[];
  }[]
> => {
  try {
    const tags = [
      ProductTags["new-arrival"],
      ProductTags["best-seller"],
      ProductTags["todays-deal"],
      ProductTags["featured"],
    ];

    const results = await Promise.allSettled(
      tags.map((tag) => getProductsForCard({ tag }))
    );

    const productsByTag = results.map((res, idx) => {
      const tag = tags[idx];
      if (res.status === "fulfilled") {
        return {
          tag,
          products: res.value,
        };
      } else {
        console.error(`Error fetching products for tag "${tag}":`, res.reason);
        return {
          tag,
          products: [],
        };
      }
    });
    return productsByTag;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const createTagsCard = ({
  title,
  items,
}: {
  title: string[];
  items: IProductResForCard[][];
}) => {
  return [
    {
      title: title[0],
      items: items[0],
      link: {
        text: "View All",
        href: "/search?tag=new-arrival",
      },
    },
    {
      title: title[1],
      items: items[1],
      link: {
        text: "View All",
        href: "/search?tag=new-arrival",
      },
    },
    {
      title: title[2],
      items: items[items.length - 1],
      link: {
        text: "View All",
        href: "/search?tag=new-arrival",
      },
    },
  ];
};
