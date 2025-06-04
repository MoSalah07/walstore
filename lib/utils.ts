import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from "query-string";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

export const round2 = (num: number) =>
  Math.round((num + Number.EPSILON) * 100) / 100;

export const generateId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join("");

export const formatNumberWithDecimal = (num: number): string => {
  const [int, decimal] = num.toString().split(".");
  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : int;
};

export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value: string | null;
}) {
  const currentUrl = qs.parse(params);

  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  );
}

export const getFilterUrl = ({
  params,
  category,
  tag,
  sort,
  price,
  rating,
  page,
}: {
  params: {
    q?: string;
    category?: string;
    tag?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  };
  tag?: string;
  category?: string;
  sort?: string;
  price?: string;
  rating?: string;
  page?: string;
}) => {
  const newParams = { ...params };
  if (category) newParams.category = category;
  if (tag) newParams.tag = toSlug(tag);
  if (price) newParams.price = price;
  if (rating) newParams.rating = rating;
  if (page) newParams.page = page;
  if (sort) newParams.sort = sort;
  return `/search?${new URLSearchParams(newParams).toString()}`;
};
