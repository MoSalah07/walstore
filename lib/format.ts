// Prices and order IDs keep Western digits and the same "$171.22" shape in
// both languages (render inside dir="ltr" so RTL text does not flip them).
export function formatMoney(
  amount: number,
  currency: string = "USD",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _locale: string = "en",
  whole = false
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(value: number, locale: string = "en") {
  return new Intl.NumberFormat(`${locale}-u-nu-latn`).format(value);
}

export function formatDate(
  date: Date | string | number,
  locale: string = "en",
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
) {
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, options).format(new Date(date));
}

export function formatDateTime(date: Date | string | number, locale: string = "en") {
  return formatDate(date, locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function discountPercent(price: number, listPrice?: number) {
  if (!listPrice || listPrice <= price) return 0;
  return Math.round(100 - (price / listPrice) * 100);
}
