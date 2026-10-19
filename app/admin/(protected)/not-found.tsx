import type { Route } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={FileQuestion}
        title="Not found"
        description="That record or page does not exist. It may have been deleted."
        action={
          <Link
            href={"/admin" as Route}
            className="text-sm text-ember-400 underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
