"use client";

import Image from "next/image";
import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { ImageField } from "@/components/admin/image-field";
import { Field, Hint, Label } from "@/components/ui/field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { parseVideoUrl } from "@/lib/utils/video";
import type { Video } from "@/types";

export type ExperienceOption = { id: string; company: string; position: string };

export type VideoFormValues = {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  company: string;
  playlist: string;
  playlist_url: string;
  duration: string;
  published_at: string;
  experience_id: string;
  display_order: number;
  is_visible: boolean;
};

function toValues(v: Video | null, nextOrder: number): VideoFormValues {
  return {
    title: v?.title ?? "",
    description: v?.description ?? "",
    video_url: v?.video_url ?? "",
    thumbnail_url: v?.thumbnail_url ?? null,
    company: v?.company ?? "",
    playlist: v?.playlist ?? "",
    playlist_url: v?.playlist_url ?? "",
    duration: v?.duration ?? "",
    published_at: v?.published_at ?? "",
    experience_id: v?.experience_id ?? "",
    display_order: v?.display_order ?? nextOrder,
    is_visible: v?.is_visible ?? true,
  };
}

export function VideoDrawer({
  open,
  onOpenChange,
  entity,
  experiences,
  nextOrder,
  onSubmit,
  saving,
  fieldErrors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Video | null;
  experiences: ExperienceOption[];
  nextOrder: number;
  onSubmit: (values: VideoFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set, setValues } = useFormValues(toValues(entity, nextOrder));
  const embed = values.video_url ? parseVideoUrl(values.video_url) : null;
  const autoThumb = embed?.thumbnail ?? null;

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit video" : "Add video"}
      description={entity ? entity.title : "A marketing or brand video you produced."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <Field label="Title" htmlFor="title" required errors={fieldErrors.title}>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Growth Avenues brand film"
          autoFocus
        />
      </Field>

      <Field
        label="Video link"
        htmlFor="video_url"
        required
        errors={fieldErrors.video_url}
        hint="YouTube, Vimeo or a direct .mp4 link play inside the site. Other links (Instagram, Drive) open in a new tab."
      >
        <Input
          id="video_url"
          type="url"
          value={values.video_url}
          onChange={(e) => set("video_url", e.target.value.trim())}
          placeholder="https://youtu.be/…"
        />
        {embed ? (
          <Hint className="mt-1.5">
            Detected:{" "}
            <span className="font-mono uppercase">
              {embed.kind === "link" ? "external link" : embed.kind}
            </span>
          </Hint>
        ) : null}
      </Field>

      <Field label="Description" htmlFor="description" errors={fieldErrors.description}>
        <Textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What the video was for and your role in making it."
        />
      </Field>

      <ImageField
        label="Thumbnail"
        value={values.thumbnail_url}
        onChange={(url) => set("thumbnail_url", url)}
        folder="projects"
        aspect="video"
        errors={fieldErrors.thumbnail_url}
        hint={
          autoThumb
            ? "Optional. Leave empty to use the YouTube thumbnail automatically."
            : "Recommended for Vimeo, Instagram, Drive and file links. 1280×720."
        }
      />
      {!values.thumbnail_url && autoThumb ? (
        <div className="relative aspect-video w-40 overflow-hidden rounded-sm border border-line-800">
          <Image src={autoThumb} alt="" fill sizes="160px" unoptimized className="object-cover" />
          <span className="absolute bottom-1 left-1 rounded-xs bg-black/70 px-1 font-mono text-[10px] text-fg-300">
            AUTO
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Company"
          htmlFor="company"
          errors={fieldErrors.company}
          hint="Shown under the title."
        >
          <Input
            id="company"
            value={values.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Growth Avenues"
          />
        </Field>
        <Field label="Linked role" htmlFor="experience_id" errors={fieldErrors.experience_id}>
          <Select
            id="experience_id"
            value={values.experience_id}
            onChange={(e) => {
              const id = e.target.value;
              const exp = experiences.find((x) => x.id === id);
              setValues((prev) => ({
                ...prev,
                experience_id: id,
                company: prev.company || (exp ? exp.company : prev.company),
              }));
            }}
          >
            <option value="">— None —</option>
            {experiences.map((x) => (
              <option key={x.id} value={x.id}>
                {x.position} · {x.company}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Playlist / series"
          htmlFor="playlist"
          errors={fieldErrors.playlist}
          hint="Videos with the same playlist name are grouped together publicly."
        >
          <Input
            id="playlist"
            value={values.playlist}
            onChange={(e) => set("playlist", e.target.value)}
            placeholder="JavaScript DOM series"
          />
        </Field>
        <Field label="Playlist link" htmlFor="playlist_url" errors={fieldErrors.playlist_url}>
          <Input
            id="playlist_url"
            type="url"
            value={values.playlist_url}
            onChange={(e) => set("playlist_url", e.target.value.trim())}
            placeholder="https://www.youtube.com/playlist?list=…"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Duration" htmlFor="duration" errors={fieldErrors.duration} hint="e.g. 12:34">
          <Input
            id="duration"
            value={values.duration}
            onChange={(e) => set("duration", e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Published on" htmlFor="published_at" errors={fieldErrors.published_at}>
          <Input
            id="published_at"
            type="date"
            value={values.published_at}
            onChange={(e) => set("published_at", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line-800 pt-4">
        <div>
          <Label htmlFor="is_visible">Visible</Label>
          <p className="mt-0.5 text-xs text-fg-500">Hidden videos stay in admin only.</p>
        </div>
        <Switch
          id="is_visible"
          checked={values.is_visible}
          onCheckedChange={(v) => set("is_visible", v)}
        />
      </div>
    </EntityDrawer>
  );
}
