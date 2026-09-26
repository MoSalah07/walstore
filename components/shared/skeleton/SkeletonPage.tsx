"use client";
import { Skeleton } from "@/components/ui/skeleton";
import Container from "@/components/shared/container";

export default function SkeletonPage() {
  return (
    <Container className="py-5">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Image Gallery Skeleton */}
        <div className="col-span-2 space-y-4">
          <Skeleton className="w-full h-[400px]" />
          <div className="flex gap-2">
            <Skeleton className="w-20 h-20" />
            <Skeleton className="w-20 h-20" />
            <Skeleton className="w-20 h-20" />
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="col-span-2 space-y-4 md:p-5">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>

        {/* Add to Cart Skeleton */}
        <div className="col-span-1 flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Related Products Slider */}
      <div className="mt-10">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-48 w-32" />
          <Skeleton className="h-48 w-32" />
          <Skeleton className="h-48 w-32" />
          <Skeleton className="h-48 w-32" />
        </div>
      </div>
    </Container>
  );
}
