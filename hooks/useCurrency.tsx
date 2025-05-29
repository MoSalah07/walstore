import useSWR from "swr";
import { useStore } from "@/store";

type UseCurrencyProps = {
  from: string;
  amount?: number;
};

type CurrencyResponse = {
  base_code: string;
  conversion_rates: {
    [key: string]: number;
  };
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function useCurrency({ from }: UseCurrencyProps) {
  const { currency } = useStore();

  const url = `https://v6.exchangerate-api.com/v6/3a32bc874e2b396fef9ec933/latest/${from.toUpperCase()}`;

  const { data, error, isLoading } = useSWR<CurrencyResponse>(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 1000 * 60 * 60 * 12,
  });

  const rate = data?.conversion_rates?.[currency];

  const symbols = {
    USD: "$",
    EGP: "ج.م",
    EUR: "€",
  };

  return {
    rate,
    currencyName: currency,
    symbols: symbols[currency],
    isLoading,
    error,
  };
}
