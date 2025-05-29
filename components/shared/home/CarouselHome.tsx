"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { itemsCarousel } from "@/constants/data";
import { useTranslations } from "next-intl";

export function CarouselHome() {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const t = useTranslations("Home");

  return (
    <Carousel
      dir="ltr"
      className="size-full mx-auto max-h-screen shadow-xl"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {itemsCarousel.map((item) => (
          <CarouselItem key={item.title}>
            <Link href={`/${item.url}`}>
              <div className="flex-center aspect-[16/6] w-full max-h-screen p-1 relative">
                <Image
                  src={item.image}
                  alt={item.title}
                  className="object-cover object-center flex-1 w-full h-full"
                />
                <div className="absolute w-1/3 top-1/2 -translate-y-1/2 left-14 md:left-28">
                  <h2 className="text-base sm:text-xl md:text-4xl lg:text-6xl text-primary-color font-semibold">
                    {t(item.title)}
                  </h2>
                  <Button className="mt-6 bg-blue-600" size={"lg"}>
                    {t(item.btnCaption)}
                  </Button>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        style={{ backgroundColor: "#1d4ed8" }}
        aria-label="Previous Slide"
        className="left-0 md:left-12 bg-primary-color text-white"
      />
      <CarouselNext
        style={{ backgroundColor: "#1d4ed8" }}
        aria-label="Next Slide"
        className="right-0 md:right-12 bg-primary-color text-white"
      />
    </Carousel>
  );
}
