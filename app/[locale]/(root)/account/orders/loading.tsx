import Container from "@/components/shared/container";
import { PageTitleSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <Container className="flex flex-col gap-6 pb-16 pt-6 md:pt-10 lg:flex-row lg:gap-8" aria-busy>
      <Skeleton className="hidden h-[320px] w-[260px] shrink-0 rounded-xl lg:block" />
      <div className="flex flex-1 flex-col gap-5">
        <PageTitleSkeleton />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[220px] rounded-xl" />)}
      </div>
    </Container>
  );
}
