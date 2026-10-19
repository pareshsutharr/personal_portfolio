import { AdminPageHeader } from "@/components/admin/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <>
      <AdminPageHeader title="Projects" actions={<Skeleton className="h-8 w-28" />} />
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-64" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </>
  );
}
