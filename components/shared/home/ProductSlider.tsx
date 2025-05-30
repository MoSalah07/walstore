"use client";
import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { IProduct } from "@/interfaces/product.interface";
import ProductCard from "./ProductCard";
import Container from "../container";
import { Card, CardContent } from "@/components/ui/card";
import SkeletonProduct from "../skeleton/SkeletonProduct";
import { SEKELETON_TIMER } from "@/constants";

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title?: string;
  products: IProduct[];
  hideDetails?: boolean;
}) {
  const [loading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), SEKELETON_TIMER);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container className="py-6">
      <Card className="w-full rounded-md shadow-xl">
        <CardContent className="p-4 items-center gap-3">
          <div className="w-full bg-background">
            <h2 className="text-primary-color font-bold text-lg md:text-xl mb-5">
              {title}
            </h2>
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent className="gap-2">
                {loading || products.length <= 0
                  ? Array.from({ length: 8 }, (_, idx) => (
                      <CarouselItem
                        key={idx}
                        className={
                          hideDetails
                            ? "md:basis-1/4 lg:basis-1/6"
                            : "md:basis-1/3 lg:basis-1/5"
                        }
                      >
                        <SkeletonProduct />
                      </CarouselItem>
                    ))
                  : products.map((product) => (
                      <CarouselItem
                        key={product.slug}
                        className={
                          hideDetails
                            ? "md:basis-1/4 lg:basis-1/6"
                            : "md:basis-1/3 lg:basis-1/5"
                        }
                      >
                        <ProductCard
                          hideDetails={hideDetails}
                          hideAddToCart
                          hideBorder
                          product={product}
                        />
                      </CarouselItem>
                    ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
