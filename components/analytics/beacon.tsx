"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one page-view beacon per navigation to /api/hit. Reads UTM parameters
 * from the URL and the document referrer on the first page only; later
 * client-side navigations have an internal referrer, which the server ignores.
 */
export function PageViewBeacon() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const params = new URLSearchParams(window.location.search);
    const payload = {
      path: pathname,
      referrer: first.current ? document.referrer : "",
      utm: {
        source: params.get("utm_source") ?? params.get("ref") ?? undefined,
        medium: params.get("utm_medium") ?? undefined,
        campaign: params.get("utm_campaign") ?? undefined,
      },
    };
    first.current = false;
    const body = JSON.stringify(payload);
    try {
      if (!navigator.sendBeacon?.("/api/hit", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/hit", {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      }
    } catch {
      // never block the page
    }
  }, [pathname]);

  return null;
}
