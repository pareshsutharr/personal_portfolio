import { AdminPageHeader } from "@/components/admin/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function TechnologiesLoading() {
  return (
    <>
      <AdminPageHeader title="Technologies" actions={<Skeleton className="h-8 w-32" />} />
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
      </div>
      <TableSkeleton rows={8} cols={5} />
    </>
  );
}
