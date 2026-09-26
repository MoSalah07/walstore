"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { MoreHorizontal, Pencil, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { AdminProduct, deleteProduct, setProductPublished } from "@/actions/admin-product.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProductsTable({
  products,
  savedId,
  lowStock,
}: {
  products: AdminProduct[];
  savedId?: string;
  lowStock: number;
}) {
  const t = useTranslations("AdminProducts");
  const tc = useTranslations("Categories");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  useEffect(() => {
    if (savedId) toast.success(t("Product saved"), { id: `saved-${savedId}` });
  }, [savedId, t]);

  const publish = (p: AdminProduct, v: boolean) =>
    start(async () => {
      const r = await setProductPublished(p._id, v);
      if (r.ok) toast.success(v ? t("Published toast") : t("Unpublished toast"));
      router.refresh();
    });

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("col.product")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("col.category")}</TableHead>
            <TableHead className="text-end">{t("col.price")}</TableHead>
            <TableHead className="text-end">{t("col.stock")}</TableHead>
            <TableHead className="hidden text-end md:table-cell">{t("col.sold")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("col.published")}</TableHead>
            <TableHead className="w-20"><span className="sr-only">{t("col.actions")}</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const low = p.countInStock <= lowStock;
            const updated = p._id === savedId;
            return (
              <TableRow key={p._id} className={cn(updated && "bg-success-bg/60 hover:bg-success-bg")}>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-sm bg-sunken dark:bg-[#E9ECF1]">
                      <span className="relative size-[80%]">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-contain mix-blend-multiply" />}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2">
                        <Link href={`/admin/products/${p._id}`} className="line-clamp-1 max-w-[340px] font-semibold hover:underline">{p.name}</Link>
                        {updated && <Badge variant="success" size="sm">{t("Updated")}</Badge>}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.brand}</span>
                    </span>
                  </span>
                </TableCell>
                <TableCell className="hidden text-foreground-secondary lg:table-cell">{tc.has(p.category) ? tc(p.category) : p.category}</TableCell>
                <TableCell className="text-end">
                  <span className="block font-bold tabular-nums">{formatMoney(p.price)}</span>
                  {p.listPrice > p.price && <del className="text-xs text-muted-foreground tabular-nums">{formatMoney(p.listPrice)}</del>}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {low ? (
                    <span className={cn("inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-xs font-bold", p.countInStock === 0 ? "bg-error-bg text-error-fg" : "bg-deal-subtle text-deal")}>
                      <TriangleAlert className="size-3" aria-hidden />
                      {p.countInStock === 0 ? t("Out") : t("n low", { count: p.countInStock })}
                    </span>
                  ) : (
                    p.countInStock
                  )}
                </TableCell>
                <TableCell className="hidden text-end tabular-nums text-foreground-secondary md:table-cell">{p.numSales}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Switch
                    checked={p.isPublished}
                    disabled={pending}
                    onCheckedChange={(v) => publish(p, v)}
                    aria-label={t("Published for", { name: p.name })}
                  />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <Link href={`/admin/products/${p._id}`} aria-label={t("Edit", { name: p.name })} className="flex size-8 items-center justify-center rounded-sm hover:bg-sunken">
                      <Pencil className="size-4" />
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger aria-label={t("More actions", { name: p.name })} className="flex size-8 items-center justify-center rounded-sm hover:bg-sunken">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${p.slug}`} target="_blank">{t("View in store")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => publish(p, !p.isPublished)}>
                          {p.isPublished ? t("Unpublish") : t("Publish")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => setToDelete(p)}>
                          {t("Delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent closeLabel={t("Close")}>
          <DialogHeader>
            <DialogTitle>{t("Delete title", { name: toDelete?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("Delete body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToDelete(null)}>{t("Cancel")}</Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await deleteProduct(toDelete!._id);
                  if (r.ok) toast.success(t("Deleted toast"));
                  setToDelete(null);
                  router.refresh();
                })
              }
            >
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
