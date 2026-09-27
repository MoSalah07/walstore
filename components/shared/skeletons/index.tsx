import { Skeleton } from "@/components/ui/skeleton";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Skeletons mirror the real layouts so nothing jumps when data arrives.

export function ProductCardSkeleton() {
  return (
    <div className={cardVariants({ flush: true, className: "flex flex-col overflow-hidden" })}>
      <Skeleton className="aspect-[302/280] rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-6 w-1/3" />
        <Skeleton className="mt-1 hidden h-10 w-full rounded-[10px] md:block" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={cardVariants({ flush: true, className: "overflow-hidden" })}>
      <Skeleton className="h-11 rounded-none" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-border-soft px-5 py-3.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function PageTitleSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-8 w-56 md:h-10" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}
