import BannerImage_2 from "@/public/images/banner2.jpg";
import BannerImage_3 from "@/public/images/banner3.jpg";
import { StaticImageData } from "next/image";

export const itemsCarousel: {
  image: StaticImageData;
  title: string;
  url: string;
  btnCaption: string;
}[] = [
  {
    image: BannerImage_2,
    title: "Best Deals on Wrist Watches",
    url: "search?category=Wrist+Watches",
    btnCaption: "View All",
  },
  {
    image: BannerImage_3,
    title: "Most Popular Shoes For Sale",
    url: "search?category=Shoes",
    btnCaption: "Shop Now",
  },
];
