"use client";

import Image from "next/image";
import { Clapperboard, Plus } from "lucide-react";
import { EntityList } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createVideo,
  deleteVideo,
  reorderVideos,
  toggleVideo,
  updateVideo,
} from "@/lib/actions/videos";
import { isOptimizableImage } from "@/lib/utils/image";
import { parseVideoUrl } from "@/lib/utils/video";
import type { Video } from "@/types";
import { VideoDrawer, type ExperienceOption } from "./video-form";

export function VideoManager({
  items,
  experiences,
  initialOpen = false,
}: {
  items: Video[];
  experiences: ExperienceOption[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<Video, "is_visible">(
    {
      create: createVideo,
      update: updateVideo,
      remove: deleteVideo,
      reorder: reorderVideos,
      toggle: toggleVideo,
    },
    { initialOpen },
  );

  return (
    <>
      <AdminPageHeader
        title="Videos"
        description="Marketing and brand videos you produced. Shown in the “Beyond code” section of the experience page."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add video
          </Button>
        }
      />

      <EntityList
        items={items}
        searchable
        searchPlaceholder="Search videos…"
        renderRow={(v) => {
          const embed = parseVideoUrl(v.video_url);
          const thumb = v.thumbnail_url ?? embed.thumbnail;
          return {
            leading: (
              <span className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-line-800 bg-surface-800">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized={!isOptimizableImage(thumb)}
                    className="object-cover"
                  />
                ) : (
                  <Clapperboard className="h-4 w-4 text-fg-500" />
                )}
              </span>
            ),
            title: v.title,
            subtitle: v.company ?? v.video_url,
            badges: (
              <>
                {v.playlist ? <Badge tone="ember">{v.playlist}</Badge> : null}
                <Badge mono tone={embed.kind === "link" ? "amber" : "neutral"}>
                  {embed.kind === "link" ? "External link" : embed.kind}
                </Badge>
              </>
            ),
          };
        }}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={crud.reorder}
        emptyState={{
          icon: Clapperboard,
          title: "No videos yet",
          description:
            "Paste a YouTube, Vimeo or direct video link to show it on the experience page.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add video
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <VideoDrawer
          key={crud.editing?.id ?? "new"}
          open={crud.open}
          onOpenChange={crud.setOpen}
          entity={crud.editing}
          experiences={experiences}
          nextOrder={items.length + 1}
          onSubmit={crud.submit}
          saving={crud.saving}
          fieldErrors={crud.fieldErrors}
        />
      ) : null}
    </>
  );
}
