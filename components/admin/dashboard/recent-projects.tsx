import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, FolderKanban, Star } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils/format";
import type { RecentProject } from "@/lib/queries/admin";
import type { ProjectStatus } from "@/types";

const STATUS_TONE: Record<ProjectStatus, "success" | "neutral" | "outline"> = {
  published: "success",
  draft: "neutral",
  archived: "outline",
};

export function RecentProjects({ projects }: { projects: RecentProject[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Recent projects"
        description="Last five updated"
        actions={
          <Link
            href={"/admin/projects" as Route}
            className="inline-flex items-center gap-1 text-xs text-fg-300 transition-colors hover:text-fg-50"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />
      {projects.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to populate the public work section."
            className="py-10"
            action={
              <ButtonLink href="/admin/projects/new" size="sm">
                Add project
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-line-800">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/projects/${p.id}` as Route}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-800/60"
              >
                <span className="relative h-9 w-12 shrink-0 overflow-hidden rounded-xs border border-line-800 bg-surface-800">
                  {p.thumbnail ? (
                    <Image
                      src={p.thumbnail}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized={p.thumbnail.endsWith(".svg")}
                    />
                  ) : (
                    <FolderKanban
                      className="absolute inset-0 m-auto h-4 w-4 text-fg-700"
                      aria-hidden
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-fg-100">{p.title}</span>
                    {p.featured ? (
                      <Star className="h-3 w-3 shrink-0 text-ember-400" aria-label="Featured" />
                    ) : null}
                  </div>
                  <p className="truncate font-mono text-[11px] text-fg-500">/{p.slug}</p>
                </div>
                <Badge tone={STATUS_TONE[p.status]} mono>
                  {p.status}
                </Badge>
                <span className="hidden shrink-0 font-mono text-[11px] text-fg-500 sm:inline">
                  {relativeTime(p.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
