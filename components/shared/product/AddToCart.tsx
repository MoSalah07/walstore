"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Orderitem } from "@/interfaces/types";
import useCartStore from "@/store/use-cart-store";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface IProps {
  item: Orderitem;
  minimal?: boolean;
}

export default function AddToCart({ item, minimal = false }: IProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const t = useTranslations("Product");
  const { addItem } = useCartStore();
  const { push } = useRouter();

  return minimal ? (
    <Button
      className="rounded-full w-auto"
      onClick={() => {
        addItem(item, quantity);
        toast.success(t("product has been successfully"));
        push(`/cart`);
      }}
    >
      {t("Add to Cart")}
    </Button>
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
        onClick={() => {
          const itemId = addItem(item, quantity);
          toast.success(t("product has been successfully"));
          push(`/cart/${itemId}`);
        }}
      >
        {t("Add to Cart")}
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          addItem(item, quantity);
          toast.success(t("product has been successfully"));
          push(`/checkout`);
        }}
        className="w-full rounded-full "
      >
        {t("Buy Now")}
      </Button>
    </div>
  );
}
