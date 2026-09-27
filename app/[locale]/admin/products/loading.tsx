import { PageTitleSkeleton, TableSkeleton } from "@/components/shared/skeletons";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy>
      <PageTitleSkeleton />
      <TableSkeleton />
    </div>
  );
}
