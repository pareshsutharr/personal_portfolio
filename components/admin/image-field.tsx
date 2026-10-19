"use client";

import * as React from "react";
import Image from "next/image";
import { FileText, ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listMedia, uploadMedia } from "@/lib/actions/media";
import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/utils/format";
import { MAX_IMAGE_BYTES, MAX_PDF_BYTES, type MediaFolder } from "@/lib/utils/storage";
import type { Media } from "@/types";

/**
 * Image/PDF picker used across admin forms.
 * - Upload (with preview + compression for large JPEG/PNG)
 * - Pick from the media library
 * - Replace / remove
 * Emits the public URL via onChange. Renders a hidden input when `name` is set.
 */
export function ImageField({
  label,
  name,
  value,
  onChange,
  folder = "general",
  accept = "image",
  hint,
  errors,
  aspect = "video",
  altValue,
  onAltChange,
}: {
  label?: string;
  name?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: MediaFolder;
  accept?: "image" | "pdf" | "any";
  hint?: string;
  errors?: string[] | string | null;
  aspect?: "video" | "square" | "portrait" | "wide";
  altValue?: string | null;
  onAltChange?: (alt: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const acceptAttr =
    accept === "image"
      ? "image/jpeg,image/png,image/webp,image/svg+xml"
      : accept === "pdf"
        ? "application/pdf"
        : "image/jpeg,image/png,image/webp,image/svg+xml,application/pdf";

  const isPdf = value?.toLowerCase().endsWith(".pdf");

  async function handleFile(file: File) {
    const isImage = file.type.startsWith("image/");
    if (accept === "image" && !isImage) return toast.error("Choose an image file.");
    if (accept === "pdf" && file.type !== "application/pdf") return toast.error("Choose a PDF.");
    if (isImage && file.size > MAX_IMAGE_BYTES && file.type === "image/svg+xml")
      return toast.error("SVG must be 5 MB or smaller.");
    if (!isImage && file.size > MAX_PDF_BYTES) return toast.error("PDF must be 10 MB or smaller.");

    setUploading(true);
    try {
      let toUpload = file;
      let width: number | null = null;
      let height: number | null = null;
      if (isImage && file.type !== "image/svg+xml") {
        const result = await compressImage(file);
        toUpload = result.file;
        width = result.width;
        height = result.height;
      }
      const fd = new FormData();
      fd.set("file", toUpload);
      fd.set("folder", folder);
      if (width) fd.set("width", String(width));
      if (height) fd.set("height", String(height));
      const res = await uploadMedia(fd);
      if (!res.ok) return toast.error(res.error);
      onChange(res.data.url);
      toast.success("Uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  }[aspect];

  return (
    <Field label={label} hint={hint} errors={errors}>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
        className={cn(
          "relative overflow-hidden rounded-md border border-line-700 bg-surface-900",
          dragOver && "border-ember-500",
          aspectClass,
          accept === "pdf" && "aspect-auto",
        )}
      >
        {value ? (
          isPdf || accept === "pdf" ? (
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-700">
                <FileText className="h-5 w-5 text-fg-300" />
              </div>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm text-fg-100 underline-offset-4 hover:text-ember-300 hover:underline"
              >
                {value.split("/").pop()}
              </a>
            </div>
          ) : (
            <Image
              src={value}
              alt={altValue ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized={value.endsWith(".svg")}
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 p-6 text-sm text-fg-500 hover:text-fg-300"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : accept === "pdf" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            <span>{uploading ? "Uploading…" : "Drop a file here or click to upload"}</span>
          </button>
        )}
        {uploading && value ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-5 w-5 animate-spin text-fg-50" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" /> {value ? "Replace" : "Upload"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setPickerOpen(true)}
          disabled={uploading}
        >
          <Search className="h-3.5 w-3.5" /> Library
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(null)}
            disabled={uploading}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>

      {onAltChange && value && !isPdf ? (
        <Input
          placeholder="Alt text (describe the image)"
          value={altValue ?? ""}
          onChange={(e) => onAltChange(e.target.value)}
          aria-label="Alt text"
        />
      ) : null}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        accept={accept}
        onPick={(m) => {
          onChange(m.url);
          if (onAltChange && m.alt_text) onAltChange(m.alt_text);
          setPickerOpen(false);
        }}
      />
    </Field>
  );
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
  accept = "image",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (media: Media) => void;
  accept?: "image" | "pdf" | "any";
}) {
  const [search, setSearch] = React.useState("");
  const key = open ? `${accept}:${search}` : "";
  const [result, setResult] = React.useState<{ key: string; items: Media[] }>({
    key: "",
    items: [],
  });
  const items = result.key === key && key ? result.items : null;

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listMedia({ search: search || undefined }).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        toast.error(res.error);
        setResult({ key, items: [] });
        return;
      }
      const filtered = res.data.filter((m) =>
        accept === "any"
          ? true
          : accept === "pdf"
            ? m.mime_type === "application/pdf"
            : m.mime_type?.startsWith("image/"),
      );
      setResult({ key, items: filtered });
    });
    return () => {
      cancelled = true;
    };
  }, [open, search, accept, key]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Media library" className="max-w-3xl">
      <div className="mb-4">
        <Input
          placeholder="Search by filename or alt text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {items === null ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media yet"
          description="Upload a file to see it here."
        />
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onPick(m)}
                className="group relative block aspect-square w-full overflow-hidden rounded-sm border border-line-700 bg-surface-800 text-left hover:border-ember-500"
              >
                {m.mime_type?.startsWith("image/") ? (
                  <Image
                    src={m.url}
                    alt={m.alt_text ?? m.filename}
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized={m.mime_type === "image/svg+xml"}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-6 w-6 text-fg-500" />
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 font-mono text-[10px] text-fg-300">
                  {m.filename} · {formatBytes(m.size_bytes)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/**
 * Client-side compression: resizes to max 2400px and re-encodes JPEG/PNG as
 * WEBP at 0.86 quality. Keeps the original if it is already small.
 */
async function compressImage(file: File): Promise<{ file: File; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 2400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  if (scale === 1 && file.size < 600 * 1024) {
    return { file, width, height };
  }

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
