import { AdminPageHeader } from "@/components/admin/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function IndustriesLoading() {
  return (
    <>
      <AdminPageHeader title="Industries" actions={<Skeleton className="h-8 w-32" />} />
      <TableSkeleton rows={6} cols={4} />
    </>
  );
}
