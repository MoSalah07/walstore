import useSWR from "swr";
import { useStore } from "@/store";
import useMounted from "./use-mounted";

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
  // The chosen currency lives in localStorage: wait for mount to avoid a
  // server/client mismatch.
  const mounted = useMounted();

  const key =
    process.env.NEXT_PUBLIC_SECRET_KEY_CUREENCY || "3a32bc874e2b396fef9ec933";
  const url = `https://v6.exchangerate-api.com/v6/${key}/latest/${from.toUpperCase()}`;

  const { data, error, isLoading } = useSWR<CurrencyResponse>(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 1000 * 60 * 60 * 12,
  });

  // USD is the store currency: never wait on the network for it.
  const rate =
    currency === from.toUpperCase() ? 1 : data?.conversion_rates?.[currency];
  const isReady = mounted && !!rate;

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
    isReady,
    error,
  };
}
