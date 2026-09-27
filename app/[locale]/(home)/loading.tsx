import Container from "@/components/shared/container";
import { ProductGridSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <Container className="flex flex-col gap-12 pb-16 pt-5 md:gap-[72px] md:pt-8" aria-busy>
      <div className="flex flex-col gap-4 md:gap-6">
        <Skeleton className="h-[360px] rounded-2xl md:h-[480px] md:rounded-3xl lg:h-[540px]" />
        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
          <Skeleton className="h-[150px] rounded-2xl md:h-[180px]" />
          <Skeleton className="h-[150px] rounded-2xl md:h-[180px]" />
        </div>
      </div>
      <ProductGridSkeleton count={4} className="lg:grid-cols-4 xl:grid-cols-4" />
    </Container>
  );
}
