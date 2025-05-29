import React from "react";
import Container from "../container";
import { IProductResForCard } from "@/interfaces/product.interface";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface IProps {
  cards: {
    title: string;
    items: IProductResForCard[];
    link: {
      text: string;
      href: string;
    };
  }[];
}

export default async function TagsCardsHome({ cards }: IProps) {
  const t = await getTranslations("Home");
  return (
    <Container className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="flex flex-col rounded-md shadow-xl">
          <CardContent className="p-4 flex-1">
            <h2 className="font-semibold text-base md:text-lg text-primary-color">
              {card.title}
            </h2>
            <div className="grid grid-cols-2 gap-8">
              {card.items.map((item) => {
                return (
                  <Link
                    key={item._id.toString()}
                    href={item.href}
                    className="flex flex-col transition-transform duration-300 hover:scale-110"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="aspect-square object-scale-down max-w-full h-auto mx-auto"
                      width={120}
                      height={120}
                    />
                    <p className="text-center text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
          {card.link && (
            <CardFooter>
              <Link
                href={card.link.href}
                className="mt-4 block transition-all duration-300 hover:text-primary-color hover:underline"
              >
                {t(card.link.text)}
              </Link>
            </CardFooter>
          )}
        </Card>
      ))}
    </Container>
  );
}
