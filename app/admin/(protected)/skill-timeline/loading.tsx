import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-6">
        <TableSkeleton rows={4} cols={3} />
        <TableSkeleton rows={4} cols={3} />
      </div>
    </div>
  );
}
