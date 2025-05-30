"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY } from "@/constants/currency";
import { useStore } from "@/store";
import { useTranslations } from "next-intl";
import React from "react";

export default function FooterSwitcherCurrency() {
  const { currency, setCurrency } = useStore();
  const t = useTranslations("Footer");
  return (
    <div>
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="text-white sm:w-52">
          <SelectValue
            placeholder={t("Select a currency")}
            className="text-white"
          />
        </SelectTrigger>
        <SelectContent side="bottom">
          {CURRENCY.map((item) => (
            <SelectItem
              key={item}
              value={item}
              onClick={() => setCurrency(item as "EUR" | "USD" | "EGP")}
            >
              {item === "USD"
                ? `United States Dollar (${item})`
                : item === "EUR"
                ? `Euro (${item})`
                : `Egyptian Pound (${item})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
