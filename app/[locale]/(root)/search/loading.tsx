import Container from "@/components/shared/container";
import { PageTitleSkeleton, ProductGridSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <Container className="flex flex-col gap-6 pb-16 pt-6 md:pt-10" aria-busy>
      <PageTitleSkeleton />
      <div className="flex items-start gap-8">
        <Skeleton className="hidden h-[620px] w-[280px] shrink-0 rounded-lg lg:block" />
        <ProductGridSkeleton className="flex-1" />
      </div>
    </Container>
  );
}
