import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { OrderDTO } from "@/actions/order.action";
import Price from "@/components/shared/price";
import { Link } from "@/i18n/routing";

// Order items with thumbnail, variant, quantity and line total.
export default async function OrderLines({
  items,
  actions,
}: {
  items: OrderDTO["items"];
  actions?: (item: OrderDTO["items"][number]) => React.ReactNode;
}) {
  const t = await getTranslations("Orders");
  return (
    <ul>
      {items.map((l, i) => (
        <li key={`${l.product}-${i}`} className="flex items-center gap-4 border-b border-border-soft px-5 py-4 last:border-0 md:gap-5 md:px-6 md:py-5">
          <Link
            href={`/product/${l.slug}`}
            tabIndex={-1}
            aria-hidden
            className="relative flex size-16 shrink-0 items-center justify-center rounded-[14px] bg-sunken dark:bg-[#E9ECF1] md:size-24"
          >
            <span className="relative size-[80%]">
              <Image src={l.image} alt="" fill sizes="96px" className="object-contain mix-blend-multiply" />
            </span>
          </Link>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <Link href={`/product/${l.slug}`} className="line-clamp-2 text-[15px] font-semibold hover:underline md:text-base">
              {l.name}
            </Link>
            <span className="text-[13px] text-foreground-secondary md:text-sm">
              {[l.color, l.size, `${t("Qty")} ${l.quantity}`].filter(Boolean).join(" · ")} · <Price amount={l.price} />
            </span>
          </span>
          <span className="flex flex-col items-end gap-2">
            <Price amount={l.price * l.quantity} className="font-display text-lg font-extrabold md:text-xl" />
            {actions?.(l)}
          </span>
        </li>
      ))}
    </ul>
  );
}
