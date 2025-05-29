"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

interface IProps {
  item: {
    clientId: string;
    product: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    countInStock: number;
    quantity: number;
    size: string;
    color: string;
    category: string;
  };
  minimal?: boolean;
}

export default function AddToCart({ item, minimal = false }: IProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const t = useTranslations("Product");
  return minimal ? (
    ""
  ) : (
    <div className="w-full space-y-2">
      <Select
        value={quantity.toString()}
        onValueChange={(i) => setQuantity(Number(i))}
      >
        <SelectTrigger>
          <SelectValue>
            {t("Quantity")}: {quantity}
          </SelectValue>
        </SelectTrigger>
        <SelectContent position="popper">
          {Array.from({ length: item.countInStock }).map((_, i) => (
            <SelectItem key={i} value={(i + 1).toString()}>
              {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        className="rounded-full w-full"
        type="button"
        // onClick={async () => {
        //   try {
        //     const itemId = await addItem(item, quantity);
        //     router.push(`/cart/${itemId}`);
        //   } catch (error: any) {
        //     toast({
        //       variant: "destructive",
        //       description: error.message,
        //     });
        //   }
        // }}
      >
        {t("Add to Cart")}
      </Button>
      <Button
        variant="secondary"
        // onClick={() => {
        //   try {
        //     addItem(item, quantity);
        //     router.push(`/checkout`);
        //   } catch (error: any) {
        //     toast({
        //       variant: "destructive",
        //       description: error.message,
        //     });
        //   }
        // }}
        className="w-full rounded-full "
      >
        {t("Buy Now")}
      </Button>
    </div>
  );
}
