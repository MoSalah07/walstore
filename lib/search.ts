export type SearchParams = {
  q?: string;
  category?: string;
  tag?: string;
  price?: string;
  rating?: string;
  sort?: string;
  page?: string;
};

export const SORT_ORDERS = [
  "best-selling",
  "price-low-to-high",
  "price-high-to-low",
  "newest-arrivals",
  "avg-customer-review",
] as const;

// USD ranges; labels are rendered in the shopper's currency.
export const PRICE_RANGES = [
  { value: "1-20", from: 1, to: 20 },
  { value: "21-50", from: 21, to: 50 },
  { value: "51-1000", from: 51, to: 1000 },
];

export const RATINGS = ["4", "3", "2", "1"];

const isSet = (v?: string) => !!v && v !== "all";

// Builds /search?... from the current params plus a patch. Changing any
// filter resets to page 1; "all" or empty values are dropped.
export function searchHref(params: SearchParams, patch: Partial<SearchParams> = {}) {
  const next: SearchParams = { ...params, ...patch };
  if (!("page" in patch)) delete next.page;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (!isSet(v)) continue;
    if (k === "sort" && v === "best-selling") continue;
    if (k === "page" && v === "1") continue;
    sp.set(k, v as string);
  }
  const qs = sp.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}

export function activeFilters(params: SearchParams) {
  return (["q", "category", "tag", "price", "rating"] as const).filter((k) => isSet(params[k]));
}
