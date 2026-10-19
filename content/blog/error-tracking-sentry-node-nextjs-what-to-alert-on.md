---
title: "Error tracking with Sentry in Node and Next.js: setup, the noise filter, and the three alerts that are worth a notification"
description: "Logs tell you what happened if you go and look. Error tracking tells you when something new breaks, grouped, with the stack and the request. How Sentry is wired into the Express API and the Next.js apps, what gets scrubbed before it leaves the server, how the noise was cut from forty alerts a day to the ones that matter, and the free-tier limits."
date: 2028-07-17T03:30:00Z
tags: [sentry, monitoring, nodejs, nextjs, operations]
keywords: [sentry node.js express setup, sentry next.js app router, sentry alert rules noise, error tracking small project, sentry scrub sensitive data]
project: growth-avenues
image: /blog/stock/code-2.webp
imageAlt: "Source code on a dark monitor"
imageCredit: "luis gomes"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Pexels-luis-gomes-546819.jpg"
imageLicense: "CC0"
---

The monitoring post covered uptime and disk. This one covers the thing in between: the app is up and a particular request is failing for a particular user, and nobody knows until they complain. Sentry, or any of the comparable tools, closes that gap. The setup is half an hour; tuning it so it is useful took a few weeks.

## Express

```js
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV,            // "production" | "staging"
  release: process.env.GIT_SHA,                // set by the deploy script
  tracesSampleRate: 0.05,                      // 5% of requests get performance traces
  beforeSend(event) { return scrub(event); },
  ignoreErrors: ["AbortError", /^HttpError: 4\d\d/],
});
// ... routes ...
Sentry.setupExpressErrorHandler(app);          // before your own error handler
app.use(errorHandler);
```

The release tag is what makes "this started in the deploy at 14:05" visible. The 4xx filter is the first noise cut: a 404 or a validation failure is not an error in the app, it is a client doing something wrong, and those are counted in logs rather than tracked as issues.

Inside the error handler, the request id goes onto the event so a support ticket can be matched to the exact occurrence:

```js
Sentry.getCurrentScope().setTag("requestId", res.getHeader("X-Request-Id"));
Sentry.getCurrentScope().setUser({ id: req.user?.id });    // id only, never email or name
```

## Next.js

The Sentry wizard generates three config files for server, client and edge, plus an `instrumentation.ts`. The client config gets `replaysSessionSampleRate: 0` and `replaysOnErrorSampleRate: 0.1`, so a session replay is captured for one in ten errors and never otherwise. Server actions are wrapped with `Sentry.withServerActionInstrumentation` so a thrown action shows up with its name.

## Scrubbing

Before any event leaves the server:

```js
function scrub(event) {
  delete event.request?.cookies;
  if (event.request?.headers) for (const h of ["authorization", "cookie", "x-api-key"]) delete event.request.headers[h];
  if (event.request?.data) event.request.data = redactKeys(event.request.data, ["password", "otp", "token", "accountNumber", "pan"]);
  return event;
}
```

Sentry's own server-side scrubbing is on as well; this is the layer I control. An error tracker is a third party holding your request bodies, and the HRMS's request bodies contain salaries. Scrub first.

## Cutting the noise

The first week produced forty alerts a day. Almost none were actionable. What cut it:

- **4xx filtered**, above.
- **Bot traffic**: requests with no user agent or known crawler agents hitting non-existent routes. Filtered in `beforeSend` by tag.
- **Browser extensions** throwing in the client bundle: `ignoreErrors` patterns for the common ones, and `denyUrls` for `chrome-extension://`.
- **Network errors in the client** (`Failed to fetch`) when someone's connection drops: grouped and muted, since the app retries.
- **The same error from one broken device** every thirty seconds: rate-limited per fingerprint on Sentry's side.

What remains is a few issues a week, each worth opening.

## The three alerts

Everything else is visible in the dashboard when I look. These three send a notification:

1. **A new issue in production**, first seen in the last hour. Something that has never broken before just did.
2. **A regression**: an issue marked resolved that reappears. The fix did not hold, or a deploy undid it.
3. **A spike**: any issue exceeding 50 events in ten minutes. Whatever it is, it is affecting many people now.

Each goes to a Slack channel and, for production, an email. Nothing pages a phone at night; an uptime alert does that, and an error spike without downtime can wait until morning.

## Free tier

The free plan covers a few thousand errors a month and a modest number of replays and traces, which the sample rates above keep within. Three apps across two clients fit comfortably. The thing that blows the quota is an unfiltered error loop, which the rate limit and the 4xx filter prevent.

## Alternatives

GlitchTip is an open-source, Sentry-compatible server that runs on a VPS and takes the same SDKs; one client with a data-residency requirement uses it. Highlight and Bugsnag do the same job. The configuration above transfers almost unchanged.

## Sources

- Sentry for Express: [docs.sentry.io/platforms/javascript/guides/express](https://docs.sentry.io/platforms/javascript/guides/express/)
- Sentry for Next.js: [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- Filtering events: [docs.sentry.io/platforms/javascript/configuration/filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/)
- Sentry data scrubbing: [docs.sentry.io/security-legal-pii/scrubbing](https://docs.sentry.io/security-legal-pii/scrubbing/)
- GlitchTip: [glitchtip.com/documentation](https://glitchtip.com/documentation)
