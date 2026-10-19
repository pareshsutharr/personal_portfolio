---
title: "Security headers for a Node or Next.js app: the six that matter, with the CSP that did not break the site"
description: "A security scan of a client's portal returned a page of red for missing headers. Five of them take one line each. The sixth, Content-Security-Policy, took a week of iteration to get strict without breaking the app. The config for Express and Next.js, what each header prevents, and how to roll out a CSP without a blank page."
date: 2028-03-13T03:30:00Z
tags: [security, nextjs, express, http, headers]
keywords: [security headers next.js, content security policy nonce next.js, helmet express headers, hsts preload, x-frame-options clickjacking]
project: growth-avenues
image: /blog/stock/security-2.webp
imageAlt: "Rusted hasp and padlock on a red wooden door"
imageCredit: "Estormiz"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Padlock_Valimokatu_Oulu_20250307_03.jpg"
imageLicense: "CC0"
summary: "Five headers take a line each: HSTS, nosniff, frame denial, a referrer policy and a permissions policy. The sixth, Content-Security-Policy, uses a per-request nonce via the Next.js proxy and should ship in report-only mode for a week before enforcing."
faq:
  - q: "How do I add a Content-Security-Policy to a Next.js app without breaking it?"
    a: "Generate a nonce in the proxy file, set the CSP header with that nonce and strict-dynamic, and run as Content-Security-Policy-Report-Only first to collect violations."
  - q: "Why keep style-src unsafe-inline?"
    a: "Tailwind and animation libraries set inline styles, and nonce-ing styles in React is impractical. Inline styles are a far smaller risk than inline scripts."
  - q: "Do I need these headers on Vercel?"
    a: "Vercel sets HSTS already; the rest come from the headers function in next.config or from the Nginx server block on a VPS."
---

A client's auditor ran an online scanner against the portal and sent a screenshot with a D grade. Nothing was exploited; the headers that tell browsers how to behave were simply absent. Most of them are a line. One of them is a project.

## The six

| Header | What it prevents | Value |
|---|---|---|
| `Strict-Transport-Security` | Downgrade to HTTP, cookie theft on first visit | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | Browsers guessing a file type and executing it | `nosniff` |
| `X-Frame-Options` / CSP `frame-ancestors` | Clickjacking by framing your page | `DENY` / `'none'` |
| `Referrer-Policy` | Leaking full URLs to other sites | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Pages using camera, mic, geolocation without need | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | Injected scripts running at all | See below |

## Express: helmet, then adjust

```js
import helmet from "helmet";
app.use(helmet({
  contentSecurityPolicy: false,          // set separately, see below
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,      // breaks third-party embeds; enable only if you need it
}));
app.use((req, res, next) => { res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()"); next(); });
```

Helmet's defaults are sensible; the two I change are HSTS to a longer max-age and COEP off, because it blocks the embedded YouTube players and map iframes the client uses.

## Next.js: headers in the config

```ts
// next.config.ts
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
export default { async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; } };
```

On Vercel, HSTS is already set at the platform; adding it again is harmless. On a VPS, these can equally go in the Nginx server block with `add_header ... always`.

## The CSP, done without breaking the site

A strict CSP says: only scripts I vouch for run. The vouching is a per-request nonce. Next.js supports this through the proxy file: generate a nonce, put it in the CSP header, and Next.js attaches it to its own script tags.

```ts
// proxy.ts
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-src https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}
```

`'strict-dynamic'` lets scripts loaded by a nonced script run too, which is how Next.js chunk loading works. `style-src 'unsafe-inline'` remains because Tailwind and Motion set inline styles; inline *styles* are a far smaller risk than inline scripts, and nonce-ing styles in React is not practical yet.

## Rolling it out without a blank page

1. Ship it as `Content-Security-Policy-Report-Only` first, with a `report-to` endpoint, for a week. Nothing is blocked; violations are reported.
2. Read the reports. Every third-party script, image host and iframe shows up. Add the legitimate ones; the rest were the point.
3. Switch the header name to enforcing.

The week of reports is where the YouTube thumbnails, the Supabase storage domain, and a chat widget nobody remembered adding all appeared. Enforcing on day one would have broken all three.

## Check it

```bash
curl -sI https://portal.example.in | grep -i -E 'strict-transport|content-security|x-frame|x-content|referrer|permissions'
```

Then the same online scanner the auditor used. The grade went to A, which was what the client needed, and the CSP has since caught one injected script from a compromised dependency, which was what the headers were for.

## Sources

- MDN HTTP security headers overview: [developer.mozilla.org/en-US/docs/Web/HTTP/Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- Next.js CSP guide with nonces: [nextjs.org/docs/app/guides/content-security-policy](https://nextjs.org/docs/app/guides/content-security-policy)
- Helmet: [helmetjs.github.io](https://helmetjs.github.io/)
- HSTS preload list: [hstspreload.org](https://hstspreload.org/)
- OWASP secure headers project: [owasp.org/www-project-secure-headers](https://owasp.org/www-project-secure-headers/)
- Mozilla Observatory scanner: [developer.mozilla.org/en-US/observatory](https://developer.mozilla.org/en-US/observatory)
