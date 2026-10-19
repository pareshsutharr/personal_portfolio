"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { ContactForm } from "./contact-form";

/** Best-matching project type for a service slug, so the form arrives pre-filled. */
const PROJECT_TYPE_BY_SLUG: Record<string, string> = {
  "full-stack-development": "Web application",
  "web-application-development": "Web application",
  "mobile-app-development": "Mobile application",
  "admin-crm-development": "Admin / CRM / HRMS",
  "api-development": "API / integration",
  "fintech-development": "Fintech product",
  "healthcare-development": "Healthcare product",
  "deployment-infrastructure": "Deployment / infrastructure",
  "technical-seo": "Website",
};

/**
 * "Request this service" button that opens the contact form in a dialog with
 * the service already filled in. Submissions reach the inbox with the service
 * in the subject line, and the usual email notification.
 */
export function ServiceEnquiry({
  title,
  slug,
  size = "sm",
  variant = "outline",
  label = "Request this service",
  className,
}: {
  title: string;
  slug: string;
  size?: "sm" | "md";
  variant?: "outline" | "ghost" | "primary";
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const projectType = PROJECT_TYPE_BY_SLUG[slug] ?? "";

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={cn("gap-1.5", className)}
      >
        {label}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Request: ${title}`}
        description="Tell me what you need and I will reply by email."
        className="max-w-2xl"
      >
        <ContactForm service={title} initial={{ project_type: projectType }} compact />
      </Dialog>
    </>
  );
}
