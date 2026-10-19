"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useAction } from "@/hooks/use-action";
import { updateResumeUrl } from "@/lib/actions/profile-images";
import { ImageField } from "@/components/admin/image-field";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { formatDateTime } from "@/lib/utils/format";

export function ResumeManager({
  resumeUrl,
  updatedAt,
}: {
  resumeUrl: string | null;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = React.useState<string | null>(resumeUrl);
  const save = useAction(updateResumeUrl);

  // Persist immediately when the picker emits a new URL (or null on remove).
  const onChange = (next: string | null) => {
    const prev = url;
    setUrl(next);
    void save.run([next], { onSuccess: () => router.refresh() }).then((res) => {
      if (!res || !res.ok) setUrl(prev);
    });
  };

  const filename = url ? decodeURIComponent(url.split("/").pop() ?? "resume.pdf") : null;
  const downloadHref = url
    ? `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(filename ?? "resume.pdf")}`
    : null;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Panel>
          <PanelHeader
            title="Current resume"
            description={
              updatedAt ? `Profile last updated ${formatDateTime(updatedAt)}` : undefined
            }
            actions={
              url ? (
                <>
                  <ButtonLink href={url} external variant="secondary" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View
                  </ButtonLink>
                  <ButtonLink href={downloadHref ?? url} external variant="secondary" size="sm">
                    <Download className="h-3.5 w-3.5" aria-hidden /> Download
                  </ButtonLink>
                </>
              ) : null
            }
          />
          {url ? (
            <div className="relative aspect-[1/1.2] w-full bg-surface-800 sm:aspect-[1/1.1]">
              <iframe
                title="Resume preview"
                src={`${url}#toolbar=0&navpanes=0`}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <PanelBody>
              <EmptyState
                icon={FileText}
                title="No resume uploaded"
                description="Upload a PDF below. It is served publicly at /resume and linked from the site."
                className="py-10"
              />
            </PanelBody>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Replace" description="PDF only, up to 10 MB. Saved on upload." />
          <PanelBody>
            <ImageField
              accept="pdf"
              folder="resume"
              value={url}
              onChange={onChange}
              hint={save.pending ? "Saving…" : "Stored in the resume folder of the media library."}
            />
          </PanelBody>
        </Panel>
        {filename ? (
          <Panel>
            <PanelBody className="space-y-2">
              <span className="label-mono">File</span>
              <p className="truncate font-mono text-xs text-fg-100" title={filename}>
                {filename}
              </p>
              <span className="mt-3 block label-mono">Public route</span>
              <p className="font-mono text-xs text-fg-300">/resume</p>
            </PanelBody>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
