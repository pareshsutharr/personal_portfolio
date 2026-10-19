import type { Route } from "next";

/**
 * Public routes referenced by the shell. Typed as `Route` so `<Link>` accepts
 * them even before every route file exists in `.next/types/routes.d.ts`.
 */
export const ROUTES = {
  home: "/" as Route,
  projects: "/projects" as Route,
  about: "/about" as Route,
  experience: "/experience" as Route,
  skills: "/skills" as Route,
  services: "/services" as Route,
  certifications: "/certifications" as Route,
  contact: "/contact" as Route,
} as const;

export const NAV_LINKS: { href: Route; label: string }[] = [
  { href: ROUTES.projects, label: "Work" },
  { href: ROUTES.about, label: "About" },
  { href: ROUTES.experience, label: "Experience" },
  { href: ROUTES.skills, label: "Skills" },
  { href: ROUTES.contact, label: "Contact" },
];

export const FOOTER_LINKS: { href: Route; label: string }[] = [
  { href: ROUTES.projects, label: "Work" },
  { href: ROUTES.about, label: "About" },
  { href: ROUTES.experience, label: "Experience" },
  { href: ROUTES.skills, label: "Skills" },
  { href: ROUTES.services, label: "Services" },
  { href: ROUTES.contact, label: "Contact" },
];

export function projectRoute(slug: string) {
  return `/projects/${slug}` as Route;
}
