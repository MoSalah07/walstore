"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { AdminProduct, ProductInput, deleteProduct, saveProduct, uploadProductImage } from "@/actions/admin-product.action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cardVariants } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/routing";
import { swatchFor } from "@/lib/colors";
import { discountPercent, formatMoney } from "@/lib/format";
import { cn, toSlug } from "@/lib/utils";

const TAGS = ["new-arrival", "best-seller", "todays-deal", "featured"] as const;
type Form = Omit<ProductInput, "price" | "listPrice" | "countInStock"> & { price: string; listPrice: string; countInStock: string };

const empty: Form = {
  name: "", slug: "", category: "", brand: "", description: "", images: [],
  price: "", listPrice: "0", countInStock: "0", sizes: [], colors: [], tags: [], isPublished: false,
};

function ChipInput({ id, label, values, onChange, swatch, placeholder }: {
  id: string; label: string; values: string[]; onChange: (v: string[]) => void; swatch?: boolean; placeholder: string;
}) {
  const t = useTranslations("AdminProducts");
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[10px] border border-input bg-card px-2 py-1.5 focus-within:border-foreground">
        {values.map((v) => (
          <span key={v} className="flex h-7 items-center gap-1.5 rounded-full bg-secondary pe-1 ps-2.5 text-[13px] font-semibold">
            {swatch && <span className="size-3.5 rounded-full border border-input" style={{ background: swatchFor(v) }} aria-hidden />}
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={t("Remove item", { name: v })} className="flex size-5 items-center justify-center rounded-full hover:bg-border">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}

export default function ProductForm({ product, categories }: { product?: AdminProduct; categories: string[] }) {
  const t = useTranslations("AdminProducts");
  const tc = useTranslations("Categories");
  const tt = useTranslations("Tags");
  const tv = useTranslations("Validation");
  const router = useRouter();
  const initial: Form = useMemo(
    () =>
      product
        ? {
            name: product.name, slug: product.slug, category: product.category, brand: product.brand,
            description: product.description, images: product.images, price: product.price.toFixed(2),
            listPrice: product.listPrice.toFixed(2), countInStock: String(product.countInStock),
            sizes: product.sizes, colors: product.colors, tags: product.tags, isPublished: product.isPublished,
          }
        : empty,
    [product]
  );
  const [f, setF] = useState<Form>(initial);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [newCategory, setNewCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [imagePath, setImagePath] = useState("");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const price = Number(f.price) || 0;
  const listPrice = Number(f.listPrice) || 0;
  const off = discountPercent(price, listPrice);
  const err = (k: string) => {
    const m = errors[k]?.[0];
    return m && tv.has(m) ? tv(m) : m;
  };

  const changes = product
    ? [
        product.price !== price && { k: t("Price"), from: formatMoney(product.price), to: formatMoney(price) },
        product.listPrice !== listPrice && { k: t("List price"), from: formatMoney(product.listPrice), to: formatMoney(listPrice) },
        discountPercent(product.price, product.listPrice) !== off && { k: t("Discount shown"), from: `${discountPercent(product.price, product.listPrice)}%`, to: `${off}%` },
        String(product.countInStock) !== f.countInStock && { k: t("Stock"), from: String(product.countInStock), to: f.countInStock },
        product.isPublished !== f.isPublished && { k: t("Status"), from: product.isPublished ? t("Published") : t("Draft"), to: f.isPublished ? t("Published") : t("Draft") },
        product.name !== f.name && { k: t("Name"), from: "…", to: f.name },
      ].filter(Boolean) as { k: string; from: string; to: string }[]
    : [];

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 8 - f.images.length)) {
      setUploading((n) => n + 1);
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadProductImage(fd);
      setUploading((n) => n - 1);
      if (r.ok) setF((s) => ({ ...s, images: [...s.images, r.url] }));
      else toast.error(r.error === "size" ? t("Image too big") : t("Image type"));
    }
  };

  const move = (i: number, d: -1 | 1) =>
    setF((s) => {
      const imgs = [...s.images];
      const j = i + d;
      if (j < 0 || j >= imgs.length) return s;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...s, images: imgs };
    });

  const doSave = () =>
    start(async () => {
      setFormError(null);
      const r = await saveProduct(
        { ...f, price: Number(f.price), listPrice: Number(f.listPrice || 0), countInStock: Number(f.countInStock || 0), slug: f.slug || toSlug(f.name) },
        product?._id
      );
      setConfirm(false);
      if (r.ok) {
        router.push(`/admin/products?saved=${r.id}`);
        router.refresh();
        return;
      }
      if (r.error === "slug") setErrors({ slug: [t("Slug taken")] });
      else if (r.error === "invalid") {
        setErrors(r.fields ?? {});
        setFormError(t("Fix errors"));
      } else setFormError(t("Save failed"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product?.isPublished && f.isPublished && changes.length > 0) setConfirm(true);
    else doSave();
  };

  const card = cardVariants({ className: "flex flex-col gap-4" });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {/* Sticky action bar */}
      <div className="sticky top-[60px] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background-subtle/95 px-4 py-3 backdrop-blur md:top-16 md:-mx-6 md:px-6 xl:-mx-8 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/products" aria-label={t("All products")} className={buttonVariants({ variant: "outline", size: "icon-md" })}>
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Link>
          <h1 className="truncate font-display text-xl font-extrabold tracking-[-0.02em] md:text-2xl">
            {product ? t("Edit product") : t("New product")}
          </h1>
          {dirty && <Badge variant="warning" dot>{t("Unsaved changes")}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="md" disabled={!dirty || pending} onClick={() => { setF(initial); setErrors({}); }}>
            {t("Discard")}
          </Button>
          <Button type="submit" size="md" loading={pending} disabled={!dirty && !!product}>
            {product ? t("Save changes") : t("Create product")}
          </Button>
        </div>
      </div>

      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <section className={card}>
            <h2 className="text-base font-bold">{t("Details")}</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pe-name">{t("Name")}</Label>
              <Input id="pe-name" size="sm" value={f.name} aria-invalid={!!err("name")}
                onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: slugTouched ? s.slug : toSlug(e.target.value) }))} />
              {err("name") && <p className="text-[13px] font-semibold text-destructive">{err("name")}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pe-slug">{t("Slug")}</Label>
              <div className={cn("flex h-9 items-center overflow-hidden rounded-[10px] border bg-card focus-within:border-foreground", err("slug") ? "border-destructive" : "border-input")}>
                <span className="hidden h-full items-center border-e border-border bg-background-subtle px-3 text-[13px] text-muted-foreground sm:flex" dir="ltr">/product/</span>
                <input id="pe-slug" dir="ltr" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
              </div>
              <p className={cn("text-[13px]", err("slug") ? "font-semibold text-destructive" : "text-foreground-secondary")}>{err("slug") ?? t("Slug help")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pe-brand">{t("Brand")}</Label>
                <Input id="pe-brand" size="sm" value={f.brand} aria-invalid={!!err("brand")} onChange={(e) => set("brand", e.target.value)} />
                {err("brand") && <p className="text-[13px] font-semibold text-destructive">{err("brand")}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pe-cat">{t("Category")}</Label>
                {newCategory ? (
                  <Input id="pe-cat" size="sm" value={f.category} onChange={(e) => set("category", e.target.value)} placeholder={t("New category")} />
                ) : (
                  <select id="pe-cat" value={f.category}
                    onChange={(e) => { if (e.target.value === "__new") { setNewCategory(true); set("category", ""); } else set("category", e.target.value); }}
                    className={cn("h-9 rounded-[10px] border bg-card px-3 text-sm outline-none focus-visible:border-foreground", err("category") ? "border-destructive" : "border-input")}>
                    <option value="">{t("Choose category")}</option>
                    {categories.map((c) => <option key={c} value={c}>{tc.has(c) ? tc(c) : c}</option>)}
                    <option value="__new">{t("Add new category")}</option>
                  </select>
                )}
                {err("category") && <p className="text-[13px] font-semibold text-destructive">{err("category")}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pe-desc">{t("Description")}</Label>
              <Textarea id="pe-desc" rows={5} value={f.description} maxLength={4000} aria-invalid={!!err("description")} onChange={(e) => set("description", e.target.value)} />
              <span className="text-end text-xs text-muted-foreground tabular-nums">{f.description.length} / 4000</span>
            </div>
          </section>

          <section className={card}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold">{t("Images")}</h2>
              <span className="text-[13px] text-foreground-secondary">{t("Images help")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {f.images.map((src, i) => (
                <div key={src + i} className="group relative flex aspect-square items-center justify-center rounded-md border border-border bg-media-paper">
                  <span className="relative size-[80%]">
                    <Image src={src} alt="" fill sizes="160px" className="object-contain" />
                  </span>
                  {i === 0 && <Badge variant="ink" size="sm" className="absolute start-2 top-2">{t("Cover")}</Badge>}
                  <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    <span className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("Move earlier")} className="flex size-8 items-center justify-center rounded-full bg-card shadow-sm disabled:opacity-40">
                        <ArrowLeft className="size-3.5 rtl:rotate-180" />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === f.images.length - 1} aria-label={t("Move later")} className="flex size-8 items-center justify-center rounded-full bg-card shadow-sm disabled:opacity-40">
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </button>
                    </span>
                    <button type="button" onClick={() => set("images", f.images.filter((_, j) => j !== i))} aria-label={t("Remove image")} className="flex size-8 items-center justify-center rounded-full bg-card text-destructive shadow-sm">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {f.images.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
                  className={cn("flex aspect-square flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed bg-background-subtle p-3 text-center text-[13px] font-semibold text-foreground-secondary hover:border-foreground", err("images") ? "border-destructive" : "border-input")}
                >
                  {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                  {uploading ? t("Uploading") : t("Drop images")}
                  <span className="text-xs font-normal">{t("Image rules")}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
            <div className="flex gap-2">
              <label htmlFor="pe-img" className="sr-only">{t("Image path")}</label>
              <Input id="pe-img" size="sm" dir="ltr" value={imagePath} onChange={(e) => setImagePath(e.target.value)} placeholder="/images/p11-1.jpg" />
              <Button type="button" variant="outline" size="md" className="shrink-0" disabled={!imagePath.trim().startsWith("/")}
                onClick={() => { set("images", [...f.images, imagePath.trim()]); setImagePath(""); }}>
                {t("Add path")}
              </Button>
            </div>
            {err("images") && <p className="text-[13px] font-semibold text-destructive">{err("images")}</p>}
          </section>

          <section className={card}>
            <h2 className="text-base font-bold">{t("Pricing inventory")}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {([
                ["price", t("Price"), product && product.price !== price ? t("Changed from", { value: formatMoney(product.price) }) : undefined],
                ["listPrice", t("List price"), off > 0 ? t("Shown struck", { percent: off }) : t("List price help")],
              ] as const).map(([k, label, hint]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <Label htmlFor={`pe-${k}`}>{label}</Label>
                  <div className={cn("flex h-9 items-center rounded-[10px] border bg-card focus-within:border-foreground", err(k) ? "border-destructive" : "border-input")}>
                    <span className="ps-3 text-sm text-muted-foreground">$</span>
                    <input id={`pe-${k}`} inputMode="decimal" dir="ltr" value={f[k]} onChange={(e) => set(k, e.target.value)}
                      onBlur={() => { const n = Number(f[k]); if (!Number.isNaN(n) && f[k] !== "") set(k, n.toFixed(2)); }}
                      className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm tabular-nums outline-none" />
                  </div>
                  <p className={cn("text-[13px]", err(k) ? "font-semibold text-destructive" : "text-foreground-secondary")}>{err(k) ?? hint}</p>
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pe-stock">{t("Count in stock")}</Label>
                <Input id="pe-stock" size="sm" type="number" min={0} step={1} value={f.countInStock} aria-invalid={!!err("countInStock")} onChange={(e) => set("countInStock", e.target.value)} />
                <p className={cn("text-[13px]", err("countInStock") ? "font-semibold text-destructive" : "text-foreground-secondary")}>
                  {err("countInStock") ?? (product ? t("sold so far", { count: product.numSales }) : " ")}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ChipInput id="pe-sizes" label={t("Sizes")} values={f.sizes} onChange={(v) => set("sizes", v)} placeholder={t("Add size")} />
              <ChipInput id="pe-colors" label={t("Colors")} values={f.colors} onChange={(v) => set("colors", v)} placeholder={t("Add color")} swatch />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5 xl:sticky xl:top-36">
          <section className={card}>
            <h2 className="text-base font-bold">{t("Status")}</h2>
            <label className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{t("Published")}</span>
                <span className="text-[13px] text-foreground-secondary">{t("Published help")}</span>
              </span>
              <Switch checked={f.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label={t("Published")} />
            </label>
          </section>
          <section className={card}>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-bold">{t("Tags")}</h2>
              <span className="text-[13px] text-foreground-secondary">{t("Tags help")}</span>
            </div>
            {TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={f.tags.includes(tag)} onCheckedChange={(v) => set("tags", v === true ? [...f.tags, tag] : f.tags.filter((x) => x !== tag))} />
                {tt(tag)}
              </label>
            ))}
          </section>
          <section className={card}>
            <h2 className="text-base font-bold">{t("Store preview")}</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-media">
                {f.images[0] && (
                  <span className="relative size-[75%]">
                    <Image src={f.images[0]} alt="" fill sizes="300px" className="object-contain mix-blend-multiply" />
                  </span>
                )}
                {off > 0 && <Badge variant="deal" className="absolute start-3 top-3">-{off}%</Badge>}
              </div>
              <div className="flex flex-col gap-1 p-3.5">
                <span className="type-overline text-[11px] text-muted-foreground">{f.brand || t("Brand")}</span>
                <span className="line-clamp-2 text-sm">{f.name || t("Name")}</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-extrabold tabular-nums">{formatMoney(price)}</span>
                  {off > 0 && <del className="text-xs text-muted-foreground tabular-nums">{formatMoney(listPrice)}</del>}
                </span>
              </div>
            </div>
          </section>
          {product && (
            <Button type="button" variant="destructive-outline" onClick={() => setDeleting(true)}>
              {t("Delete product")}
            </Button>
          )}
        </aside>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent closeLabel={t("Close")}>
          <DialogHeader>
            <DialogTitle>{t("Confirm title")}</DialogTitle>
            <DialogDescription>{t("Confirm body")}</DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col rounded-md border border-border">
            {changes.map((c, i) => (
              <div key={c.k} className={cn("flex items-center justify-between gap-3 px-4 py-2.5 text-sm", i > 0 && "border-t border-border-soft")}>
                <dt className="text-foreground-secondary">{c.k}</dt>
                <dd className="flex items-center gap-1.5 tabular-nums">
                  <del className="text-muted-foreground">{c.from}</del>
                  <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                  <span className="font-bold">{c.to}</span>
                </dd>
              </div>
            ))}
          </dl>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t("Keep editing")}</Button>
            <Button loading={pending} onClick={doSave}>{t("Save publish")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent closeLabel={t("Close")}>
          <DialogHeader>
            <DialogTitle>{t("Delete title", { name: product?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("Delete body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(false)}>{t("Cancel")}</Button>
            <Button variant="destructive" loading={pending}
              onClick={() => start(async () => { const r = await deleteProduct(product!._id); if (r.ok) { toast.success(t("Deleted toast")); router.push("/admin/products"); router.refresh(); } })}>
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
