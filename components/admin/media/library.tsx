"use client";

import * as React from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  FileText,
  ImageIcon,
  Loader2,
  SearchX,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { deleteMedia, listMedia, updateMedia, uploadMedia } from "@/lib/actions/media";
import { setProfileImage, type ProfileImageField } from "@/lib/actions/profile-images";
import { cn } from "@/lib/utils/cn";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  MEDIA_FOLDERS,
  PDF_MIME_TYPES,
  type MediaFolder,
} from "@/lib/utils/storage";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/panel";
import type { Media } from "@/types";

type FolderFilter = MediaFolder | "all";

type UploadItem = {
  id: string;
  file: File;
  preview: string | null;
  /** Folder chosen when the file was dropped. */
  targetFolder: MediaFolder;
  /** Grid filter active when dropped, to decide whether to prepend the result. */
  filter: FolderFilter;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

const PROFILE_TARGETS: { field: ProfileImageField; label: string }[] = [
  { field: "profile_photo", label: "Profile photo" },
  { field: "hero_photo", label: "Hero photo" },
  { field: "about_photo", label: "About photo" },
];

const ACCEPT = [...IMAGE_MIME_TYPES, ...PDF_MIME_TYPES].join(",");

const isImage = (m: Pick<Media, "mime_type">) => m.mime_type?.startsWith("image/") ?? false;

export function MediaLibrary({ initialItems }: { initialItems: Media[] }) {
  const [items, setItems] = React.useState<Media[]>(initialItems);
  const [folder, setFolder] = React.useState<FolderFilter>("all");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Media | null>(null);
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const firstRender = React.useRef(true);
  const queueRef = React.useRef<UploadItem[]>([]);
  const drainingRef = React.useRef(false);

  // Refetch when filters change (skip the initial SSR data). State updates
  // happen inside the debounce timer, never synchronously in the effect.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      void listMedia({ folder, search: search.trim() || undefined }).then((res) => {
        if (cancelled) return;
        if (res.ok) setItems(res.data);
        else toast.error(res.error);
        setLoading(false);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [folder, search]);

  const uploadFolder: MediaFolder = folder === "all" ? "general" : folder;

  const patchUpload = (id: string, patch: Partial<UploadItem>) =>
    setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  /** Sequentially uploads everything in queueRef. Safe to call repeatedly. */
  const drain = async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
      for (let next = queueRef.current.shift(); next; next = queueRef.current.shift()) {
        const item = next;
        patchUpload(item.id, { status: "uploading" });
        try {
          const fd = new FormData();
          fd.set("file", item.file);
          fd.set("folder", item.targetFolder);
          if (item.file.type.startsWith("image/") && item.file.type !== "image/svg+xml") {
            try {
              const bmp = await createImageBitmap(item.file);
              fd.set("width", String(bmp.width));
              fd.set("height", String(bmp.height));
              bmp.close();
            } catch {
              // Dimensions are optional.
            }
          }
          const res = await uploadMedia(fd);
          if (!res.ok) {
            patchUpload(item.id, { status: "error", error: res.error });
            toast.error(`${item.file.name}: ${res.error}`);
            continue;
          }
          patchUpload(item.id, { status: "done" });
          const row = res.data;
          if (item.filter === "all" || row.folder === item.filter) {
            setItems((prev) => [row, ...prev]);
          }
          toast.success(`Uploaded ${row.filename}`);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Upload failed";
          patchUpload(item.id, { status: "error", error: message });
          toast.error(`${item.file.name}: ${message}`);
        }
      }
    } finally {
      drainingRef.current = false;
    }
  };

  const enqueue = (files: FileList | File[]) => {
    const next: UploadItem[] = [];
    for (const file of Array.from(files)) {
      const img = IMAGE_MIME_TYPES.includes(file.type);
      const pdf = PDF_MIME_TYPES.includes(file.type);
      let error: string | undefined;
      if (!img && !pdf) error = "Unsupported type";
      else if (img && file.size > MAX_IMAGE_BYTES) error = "Over 5 MB";
      else if (pdf && file.size > MAX_PDF_BYTES) error = "Over 10 MB";
      else if (pdf && uploadFolder !== "resume" && uploadFolder !== "general")
        error = "PDFs go in resume or general";
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: img ? URL.createObjectURL(file) : null,
        targetFolder: uploadFolder,
        filter: folder,
        status: error ? "error" : "queued",
        error,
      });
    }
    if (next.length === 0) return;
    setUploads((u) => [...next, ...u]);
    queueRef.current.push(...next.filter((x) => x.status === "queued"));
    void drain();
  };

  // Revoke object URLs when the queue is cleared.
  const clearFinished = () => {
    setUploads((u) => {
      for (const x of u)
        if (x.status !== "uploading" && x.status !== "queued" && x.preview)
          URL.revokeObjectURL(x.preview);
      return u.filter((x) => x.status === "uploading" || x.status === "queued");
    });
  };

  const onItemUpdated = (row: Media) => {
    setItems((prev) => prev.map((m) => (m.id === row.id ? row : m)));
    setSelected((s) => (s && s.id === row.id ? row : s));
  };
  const onItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  };

  const tabs = [
    { value: "all", label: "All" },
    ...MEDIA_FOLDERS.map((f) => ({ value: f, label: f.charAt(0).toUpperCase() + f.slice(1) })),
  ];

  const activeUploads = uploads.filter(
    (u) => u.status === "queued" || u.status === "uploading",
  ).length;

  return (
    <div
      className="relative space-y-4"
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) enqueue(e.dataTransfer.files);
      }}
    >
      <Tabs tabs={tabs} value={folder} onChange={(v) => setFolder(v as FolderFilter)} />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search filename or alt text…"
          aria-label="Search media"
          className="h-9 min-w-[200px] flex-1 text-[13px] sm:max-w-xs"
        />
        <span className="ml-auto hidden font-mono text-[11px] text-fg-500 sm:inline">
          Uploads go to <span className="text-fg-300">{uploadFolder}</span>
        </span>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={activeUploads > 0}>
          <Upload className="h-3.5 w-3.5" aria-hidden /> Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) enqueue(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 ? <UploadQueue uploads={uploads} onClear={clearFinished} /> : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : items.length === 0 ? (
        search.trim() || folder !== "all" ? (
          <EmptyState
            icon={SearchX}
            title="Nothing here"
            description="No files match this folder or search."
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFolder("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ImageIcon}
            title="No media yet"
            description="Drop images or PDFs anywhere on this page, or use Upload."
            action={
              <Button size="sm" onClick={() => inputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" aria-hidden /> Upload files
              </Button>
            }
          />
        )
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelected(m)}
                className="group block w-full overflow-hidden rounded-md border border-line-800 bg-surface-900 text-left transition-colors hover:border-line-600 focus-visible:border-ember-500 focus-visible:outline-none"
              >
                <div className="relative aspect-square bg-surface-800">
                  {isImage(m) ? (
                    <Image
                      src={m.url}
                      alt={m.alt_text ?? m.filename}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 220px"
                      className="object-cover"
                      unoptimized={m.mime_type === "image/svg+xml"}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <FileText className="h-7 w-7 text-fg-500" aria-hidden />
                      <span className="label-mono">PDF</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2">
                    <Badge mono className="bg-black/60 backdrop-blur-sm">
                      {m.folder}
                    </Badge>
                  </span>
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs text-fg-100" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-fg-500">
                    {formatBytes(m.size_bytes)}
                    {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {dragOver ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-ember-500 bg-bg-950/80 backdrop-blur-[2px]"
        >
          <p className="flex items-center gap-2 text-sm font-medium text-fg-50">
            <Upload className="h-4 w-4 text-ember-400" aria-hidden /> Drop to upload into{" "}
            {uploadFolder}
          </p>
        </div>
      ) : null}

      <MediaDetailDrawer
        key={selected?.id ?? "none"}
        item={selected}
        onClose={() => setSelected(null)}
        onUpdated={onItemUpdated}
        onDeleted={onItemDeleted}
      />
    </div>
  );
}

function UploadQueue({ uploads, onClear }: { uploads: UploadItem[]; onClear: () => void }) {
  const pending = uploads.filter((u) => u.status === "queued" || u.status === "uploading").length;
  return (
    <div className="rounded-md border border-line-800 bg-surface-900">
      <div className="flex items-center justify-between border-b border-line-800 px-4 py-2">
        <span className="label-mono">
          Uploads{pending > 0 ? ` · ${pending} remaining` : " · complete"}
        </span>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={pending === uploads.length}>
          Clear finished
        </Button>
      </div>
      <ul className="divide-y divide-line-800">
        {uploads.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-2">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xs border border-line-800 bg-surface-800">
              {u.preview ? (
                // Local object URL preview; not a remote image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <FileText className="absolute inset-0 m-auto h-4 w-4 text-fg-500" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-fg-100">{u.file.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-700">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
                      u.status === "done" && "w-full bg-success",
                      u.status === "error" && "w-full bg-crimson-500",
                      u.status === "uploading" && "w-2/3 animate-pulse bg-ember-500",
                      u.status === "queued" && "w-0 bg-fg-700",
                    )}
                  />
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-[10px] text-fg-500">
                  {formatBytes(u.file.size)}
                </span>
              </div>
              {u.error ? <p className="mt-0.5 text-[11px] text-crimson-400">{u.error}</p> : null}
            </div>
            <span className="w-4 shrink-0">
              {u.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-fg-300" aria-label="Uploading" />
              ) : u.status === "done" ? (
                <Check className="h-4 w-4 text-success" aria-label="Uploaded" />
              ) : u.status === "error" ? (
                <TriangleAlert className="h-4 w-4 text-crimson-400" aria-label="Failed" />
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediaDetailDrawer({
  item,
  onClose,
  onUpdated,
  onDeleted,
}: {
  item: Media | null;
  onClose: () => void;
  onUpdated: (row: Media) => void;
  onDeleted: (id: string) => void;
}) {
  // The parent keys this component by item id, so initial state is enough.
  const [folder, setFolder] = React.useState<MediaFolder>(
    (item?.folder as MediaFolder) ?? "general",
  );
  const [alt, setAlt] = React.useState(item?.alt_text ?? "");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const update = useAction(updateMedia);
  const remove = useAction(deleteMedia);
  const setProfile = useAction(setProfileImage);

  if (!item) return null;

  const dirty = folder !== item.folder || alt !== (item.alt_text ?? "");
  const image = isImage(item);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      toast.success("URL copied.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Select the URL manually.");
    }
  };

  return (
    <>
      <Drawer
        open={!!item}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
        title={item.filename}
        description={`${item.mime_type ?? "file"} · ${formatBytes(item.size_bytes)}${
          item.width && item.height ? ` · ${item.width}×${item.height}` : ""
        }`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto text-crimson-400 hover:text-crimson-400"
              onClick={() => setConfirmOpen(true)}
              disabled={remove.pending}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              loading={update.pending}
              disabled={!dirty}
              onClick={() =>
                void update.run([item.id, { folder, alt_text: alt }], { onSuccess: onUpdated })
              }
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-md border border-line-800 bg-surface-800">
            {image ? (
              <div className="relative aspect-video">
                <Image
                  src={item.url}
                  alt={item.alt_text ?? item.filename}
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-contain"
                  unoptimized={item.mime_type === "image/svg+xml"}
                />
              </div>
            ) : (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-video flex-col items-center justify-center gap-2 text-sm text-fg-300 hover:text-fg-50"
              >
                <FileText className="h-8 w-8" aria-hidden />
                Open PDF
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="label-mono">Public URL</span>
            <div className="flex gap-2">
              <Input
                readOnly
                value={item.url}
                className="h-9 font-mono text-[11px]"
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => void copyUrl()}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </div>

          <Field label="Folder" htmlFor="media-folder" errors={update.fieldErrors.folder}>
            <Select
              id="media-folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value as MediaFolder)}
            >
              {MEDIA_FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>

          {image ? (
            <Field
              label="Alt text"
              htmlFor="media-alt"
              hint="Describe the image for screen readers and SEO."
              errors={update.fieldErrors.alt_text}
            >
              <Input
                id="media-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="e.g. Paresh at a whiteboard"
              />
            </Field>
          ) : null}

          {image ? (
            <div className="space-y-2">
              <span className="label-mono">Use on profile</span>
              <div className="flex flex-wrap gap-2">
                {PROFILE_TARGETS.map((t) => (
                  <Button
                    key={t.field}
                    variant="outline"
                    size="sm"
                    disabled={setProfile.pending}
                    onClick={() => void setProfile.run([t.field, item.url])}
                  >
                    Set as {t.label.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line-800 pt-4 text-xs">
            <dt className="label-mono">Path</dt>
            <dd className="truncate font-mono text-[11px] text-fg-300" title={item.path}>
              {item.path}
            </dd>
            <dt className="label-mono">Uploaded</dt>
            <dd className="font-mono text-[11px] text-fg-300">{formatDateTime(item.created_at)}</dd>
          </dl>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this file?"
        description={`${item.filename} will be removed from storage. Anything still referencing its URL will break.`}
        loading={remove.pending}
        onConfirm={async () => {
          await remove.run([item.id], {
            onSuccess: () => {
              setConfirmOpen(false);
              onDeleted(item.id);
            },
          });
        }}
      />
    </>
  );
}
