import type { Metadata } from "next";
import { siteUrl as sharedSiteUrl } from "@/lib/seo";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { getSiteShell } from "@/lib/queries/public";
import { CustomCursor } from "@/components/portfolio/custom-cursor";
import { PageViewBeacon } from "@/components/analytics/beacon";
import { FeedbackWidget } from "@/components/portfolio/feedback-widget";
import { ScrollProgress } from "@/components/portfolio/scroll-progress";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SplashContent, SplashProvider } from "@/components/portfolio/splash";
import { SiteFooter } from "@/components/portfolio/site-footer";
import { SiteNav } from "@/components/portfolio/site-nav";

export const revalidate = 60;

const DEFAULT_TITLE = "Paresh Suthar — Full Stack Software Engineer";
const DEFAULT_DESCRIPTION =
  "Full-stack developer in Surat, India. React, Node.js, MongoDB and Postgres, for web and mobile.";

function siteUrl(): URL {
  // Delegates to the shared helper so the fallback logic lives in one place.
  return new URL(sharedSiteUrl());
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo, settings, profile } = await getSiteShell();
  const base = siteUrl();
  const title = seo?.site_title || DEFAULT_TITLE;
  const template =
    seo?.title_template && seo.title_template.includes("%s")
      ? seo.title_template
      : "%s — Paresh Suthar";
  const description = seo?.meta_description || profile?.short_bio || DEFAULT_DESCRIPTION;
  const ogImage = seo?.og_image || "/opengraph-image";
  const twitterImage = seo?.twitter_image || ogImage;

  return {
    metadataBase: base,
    // `absolute` stops the root layout's template from wrapping the default; `template` still applies to child pages.
    title: { absolute: title, template },
    description,
    keywords: seo?.keywords?.length ? seo.keywords : undefined,
    alternates: {
      ...(seo?.canonical_url ? { canonical: seo.canonical_url } : {}),
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      type: "website",
      siteName: settings?.site_name || profile?.full_name || "Paresh Suthar",
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      url: base,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: [twitterImage],
      creator: seo?.twitter_handle || undefined,
    },
    verification: seo?.google_verification ? { google: seo.google_verification } : undefined,
    // One stable, same-origin icon set. Google shows a site icon in results only
    // when the favicon URL is stable and unambiguous, so the admin's favicon
    // setting is deliberately not used here.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const { profile, settings, seo, socialLinks } = await getSiteShell();
  const base = siteUrl();
  const name = profile?.full_name ?? "Paresh Suthar";
  const email = profile?.email ?? settings?.contact_email ?? null;

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: profile?.professional_title ?? "Full Stack Software Engineer",
    url: base.origin,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Surat",
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    worksFor: {
      "@type": "Organization",
      name: "JBV Share Broker & Fintech / Growth Avenues",
      url: "https://www.growthavenues.in",
    },
    knowsAbout: [
      "Full stack development",
      "React",
      "Next.js",
      "Node.js",
      "Express",
      "MongoDB",
      "PostgreSQL",
      "Supabase",
      "React Native",
      "Nginx",
      "Linux server deployment",
      "Fintech platforms",
    ],
    alumniOf: { "@type": "CollegeOrUniversity", name: "Veer Narmad South Gujarat University" },
    ...(socialLinks.length ? { sameAs: socialLinks.map((s) => s.url) } : {}),
    ...(email ? { email: `mailto:${email}` } : {}),
    ...(profile?.profile_photo ? { image: profile.profile_photo } : {}),
    ...(profile?.location ? { homeLocation: { "@type": "Place", name: profile.location } } : {}),
  };
  const website: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seo?.site_title || settings?.site_name || name,
    url: base.origin,
    ...(seo?.meta_description ? { description: seo.meta_description } : {}),
    author: { "@type": "Person", name },
  };

  const gaId = settings?.ga_measurement_id?.trim() || null;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-sm bg-fg-50 px-4 py-2 text-sm font-medium text-bg-950 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-ember-400"
      >
        Skip to content
      </a>
      <SplashProvider>
        <SmoothScroll />
        <ScrollProgress />
        <SiteNav email={email} socialLinks={socialLinks} />
        <main id="main" className="flex-1">
          <SplashContent>{children}</SplashContent>
        </main>
        <SiteFooter profile={profile} settings={settings} socialLinks={socialLinks} />
        <FeedbackWidget />
        <PageViewBeacon />
        <CustomCursor />
      </SplashProvider>
      <JsonLd data={person} />
      <JsonLd data={website} />
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {settings?.vercel_analytics_enabled ? <Analytics /> : null}
    </>
  );
}
