import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-line-800 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        <Skeleton className="h-9 w-full max-w-xs" />
        <TableSkeleton rows={8} cols={6} />
      </div>
    </div>
  );
}
