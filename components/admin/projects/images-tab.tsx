"use client";

import * as React from "react";
import Image from "next/image";
import { Controller, useFormContext } from "react-hook-form";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Images, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImageField, MediaPickerDialog } from "@/components/admin/image-field";
import { COVER_FRAME_LABELS, type CoverFrame } from "@/components/projects/device-frame";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Hint } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { uploadMedia } from "@/lib/actions/media";
import {
  addProjectImage,
  removeProjectImage,
  reorderProjectImages,
  updateProjectImage,
} from "@/lib/actions/project-images";
import { cn } from "@/lib/utils/cn";
import { MAX_IMAGE_BYTES } from "@/lib/utils/storage";
import { PROJECT_IMAGE_TYPE_LABELS, type ProjectImage, type ProjectImageType } from "@/types";
import type { ProjectFormValues } from "./editor-types";
import { isOptimizableUrl } from "./project-thumb";

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml";
const IMAGE_TYPES = Object.keys(PROJECT_IMAGE_TYPE_LABELS) as ProjectImageType[];

export function ImagesTab({
  projectId,
  images,
  onChange,
}: {
  projectId: string | null;
  images: ProjectImage[];
  onChange: (next: ProjectImage[]) => void;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProjectFormValues>();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<ProjectImage | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const update = useAction(updateProjectImage);
  const remove = useAction(removeProjectImage);
  const reorder = useAction(reorderProjectImages);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addRow = async (image_url: string, alt_text: string | null, current: ProjectImage[]) => {
    if (!projectId) return null;
    const res = await addProjectImage({
      project_id: projectId,
      image_url,
      alt_text: alt_text ?? "",
      caption: "",
      type: "screenshot",
      display_order: current.length + 1,
    });
    if (!res.ok) {
      toast.error(res.error);
      return null;
    }
    return res.data;
  };

  /** Multi-upload: each file → media library → project_images row. */
  const handleFiles = async (files: FileList | File[]) => {
    if (!projectId) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return toast.error("Choose image files.");
    setProgress({ done: 0, total: list.length });
    let current = images;
    let failed = 0;
    for (const [i, file] of list.entries()) {
      try {
        const prepared = await prepareImage(file);
        if (prepared.file.size > MAX_IMAGE_BYTES) {
          failed += 1;
          toast.error(`${file.name}: larger than 5 MB after compression.`);
          continue;
        }
        const fd = new FormData();
        fd.set("file", prepared.file);
        fd.set("folder", "projects");
        if (prepared.width) fd.set("width", String(prepared.width));
        if (prepared.height) fd.set("height", String(prepared.height));
        const uploaded = await uploadMedia(fd);
        if (!uploaded.ok) {
          failed += 1;
          toast.error(`${file.name}: ${uploaded.error}`);
          continue;
        }
        const row = await addRow(uploaded.data.url, uploaded.data.alt_text, current);
        if (!row) {
          failed += 1;
          continue;
        }
        current = [...current, row];
        onChange(current);
      } catch (e) {
        failed += 1;
        toast.error(e instanceof Error ? e.message : `${file.name}: upload failed.`);
      } finally {
        setProgress({ done: i + 1, total: list.length });
      }
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    const okCount = list.length - failed;
    if (okCount > 0) toast.success(`${okCount} image${okCount === 1 ? "" : "s"} added.`);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = images.findIndex((i) => i.id === active.id);
    const to = images.findIndex((i) => i.id === over.id);
    const next = arrayMove(images, from, to);
    onChange(next);
    void reorder.run([next.map((i) => i.id)], { silent: true });
  };

  const patchLocal = (row: ProjectImage) =>
    onChange(images.map((i) => (i.id === row.id ? row : i)));

  return (
    <>
      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Controller
            control={control}
            name="cover_image"
            render={({ field }) => (
              <Controller
                control={control}
                name="cover_alt"
                render={({ field: alt }) => (
                  <ImageField
                    label="Cover image"
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    folder="projects"
                    aspect="video"
                    altValue={alt.value}
                    onAltChange={alt.onChange}
                    hint="Used at the top of the case study, on cards and in the home showcase. Upload 1600×1000 (16:10) or wider; with a frame, upload the plain page screenshot and the site draws the device."
                    errors={errors.cover_image?.message ?? errors.cover_alt?.message}
                  />
                )}
              />
            )}
          />
          <Controller
            control={control}
            name="cover_frame"
            render={({ field }) => (
              <div className="space-y-1.5">
                <label
                  htmlFor="cover-frame"
                  className="block text-xs font-medium tracking-wide text-fg-300"
                >
                  Cover frame
                </label>
                <Select
                  id="cover-frame"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {(Object.keys(COVER_FRAME_LABELS) as CoverFrame[]).map((k) => (
                    <option key={k} value={k}>
                      {COVER_FRAME_LABELS[k]}
                    </option>
                  ))}
                </Select>
                <Hint>
                  Browser and laptop frames crop the screenshot to 16:10 from the top. Phone frames
                  expect a portrait capture.
                </Hint>
              </div>
            )}
          />
        </div>
        <Controller
          control={control}
          name="thumbnail"
          render={({ field }) => (
            <ImageField
              label="Thumbnail"
              value={field.value || null}
              onChange={(url) => field.onChange(url ?? "")}
              folder="projects"
              aspect="square"
              hint="Square card image. Falls back to the cover."
              errors={errors.thumbnail?.message}
            />
          )}
        />
      </div>

      <div className="border-t border-line-800 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-fg-100">
              Gallery <span className="font-mono text-[11px] text-fg-500">· {images.length}</span>
            </p>
            <Hint>
              Screenshots, dashboards, mobile frames and architecture diagrams. Drag to reorder.
            </Hint>
          </div>
          {projectId ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPickerOpen(true)}
                disabled={progress !== null}
              >
                <Search className="h-3.5 w-3.5" /> Library
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                loading={progress !== null}
              >
                <Upload className="h-3.5 w-3.5" />
                {progress ? `Uploading ${progress.done}/${progress.total}` : "Upload images"}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) void handleFiles(e.target.files);
                }}
              />
            </div>
          ) : null}
        </div>

        {!projectId ? (
          <EmptyState
            className="mt-4"
            icon={Images}
            title="Save the project first"
            description="Gallery images are attached to a saved project. The cover and thumbnail above can be set now."
          />
        ) : (
          <div
            className={cn("mt-4 rounded-md transition-colors", dragOver && "ring-1 ring-ember-500")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
            }}
          >
            {images.length === 0 ? (
              <EmptyState
                icon={Images}
                title="No gallery images"
                description="Drop images here or upload. Each one becomes a gallery entry you can type, caption and reorder."
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                    loading={progress !== null}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload images
                  </Button>
                }
              />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {images.map((img, index) => (
                      <GalleryCard
                        key={img.id}
                        image={img}
                        index={index}
                        disabled={reorder.pending}
                        onMeta={(patch) => {
                          const next = { ...img, ...patch };
                          if (
                            next.alt_text === img.alt_text &&
                            next.caption === img.caption &&
                            next.type === img.type
                          )
                            return;
                          patchLocal(next);
                          void update.run(
                            [
                              img.id,
                              {
                                alt_text: next.alt_text ?? "",
                                caption: next.caption ?? "",
                                type: next.type,
                              },
                            ],
                            { silent: true, onSuccess: patchLocal },
                          );
                        }}
                        onDelete={() => setDeleting(img)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        accept="image"
        onPick={(m) => {
          setPickerOpen(false);
          void addRow(m.url, m.alt_text, images).then((row) => {
            if (row) {
              onChange([...images, row]);
              toast.success("Image added.");
            }
          });
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove this image from the gallery?"
        description="The file stays in the media library."
        confirmLabel="Remove"
        loading={remove.pending}
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting.id;
          await remove.run([id], {
            onSuccess: () => {
              onChange(images.filter((i) => i.id !== id));
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}

function GalleryCard({
  image,
  index,
  disabled,
  onMeta,
  onDelete,
}: {
  image: ProjectImage;
  index: number;
  disabled?: boolean;
  onMeta: (patch: Partial<Pick<ProjectImage, "alt_text" | "caption" | "type">>) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled });
  const [alt, setAlt] = React.useState(image.alt_text ?? "");
  const [caption, setCaption] = React.useState(image.caption ?? "");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md border border-line-800 bg-surface-900",
        isDragging && "z-10 shadow-lg ring-1 ring-ember-500/40",
      )}
    >
      <div className="relative aspect-video bg-surface-800">
        <Image
          src={image.image_url}
          alt={image.alt_text ?? ""}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover"
          unoptimized={!isOptimizableUrl(image.image_url)}
        />
        <span className="absolute top-2 left-2 rounded-xs bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-fg-300">
          {String(index + 1).padStart(2, "0")}
        </span>
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label="Drag to reorder"
          className="absolute top-2 right-2 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-xs bg-black/70 text-fg-300 hover:text-fg-50 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              aria-label="Image type"
              value={image.type}
              onChange={(e) => onMeta({ type: e.target.value as ProjectImageType })}
              className="h-8 text-[12px]"
            >
              {IMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_IMAGE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove image"
            className="h-8 w-8 shrink-0 text-fg-500 hover:text-crimson-400"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Input
          aria-label="Alt text"
          placeholder="Alt text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={() => onMeta({ alt_text: alt.trim() || null })}
          className="h-8 text-[12px]"
        />
        <Input
          aria-label="Caption"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => onMeta({ caption: caption.trim() || null })}
          className="h-8 text-[12px]"
        />
      </div>
    </li>
  );
}

/**
 * Compact client-side compression for bulk uploads: resize to max 2400px and
 * re-encode JPEG/PNG as WEBP. SVGs and already-small files pass through.
 */
async function prepareImage(
  file: File,
): Promise<{ file: File; width: number | null; height: number | null }> {
  if (file.type === "image/svg+xml") return { file, width: null, height: null };
  const bitmap = await createImageBitmap(file);
  const maxSide = 2400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  if (scale === 1 && file.size < 600 * 1024) return { file, width, height };

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { file, width, height };
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob || blob.size >= file.size) return { file, width, height };
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return { file: new File([blob], name, { type: "image/webp" }), width, height };
}
