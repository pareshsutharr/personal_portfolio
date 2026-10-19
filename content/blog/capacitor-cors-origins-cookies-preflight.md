---
title: "CORS for a Capacitor app: origins, cookies, and the preflight that failed"
description: "The Growth HR app worked in the browser and failed on the phone with a CORS error that mentioned an origin I had never typed. What a Capacitor app's origin actually is on each platform, the exact Express cors config, and why cookies made me switch to bearer tokens."
date: 2027-09-20T03:30:00Z
tags: [capacitor, cors, express, mobile, security]
keywords: [capacitor cors error, capacitor://localhost origin, express cors capacitor app, cors preflight options 401, cookies capacitor ios]
project: growth-avenues-hrms
---

The web build of Growth HR called the API from `https://hr.growthavenues.in` and everything worked. The same build inside the Android app failed every request with a CORS error, and the origin in the error was `http://localhost`. On iOS it was `capacitor://localhost`. Neither was in the API's allow list, because I had not known they existed.

## What the app's origin is

A Capacitor app serves your web build from a local scheme. The page's origin, which is what the browser engine sends in the `Origin` header, is:

| Platform | Origin |
| --- | --- |
| Android | `http://localhost` |
| iOS | `capacitor://localhost` |
| Browser, development | `http://localhost:5173` or similar |
| Browser, production | `https://hr.growthavenues.in` |

You can change the scheme and hostname in `capacitor.config.ts` with `server.androidScheme` and `server.hostname`. Leaving the defaults and allowing them explicitly is simpler than inventing a new one.

## The Express configuration

```js
import cors from "cors";

const ALLOWED = new Set([
  "https://hr.growthavenues.in",
  "http://localhost",             // Android app
  "capacitor://localhost",        // iOS app
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173"] : []),
]);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);          // same-origin, curl, server-to-server
    cb(null, ALLOWED.has(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-App-Version"],
  maxAge: 86400,
}));
```

A function for `origin` rather than an array, so an unknown origin gets a response with no `Access-Control-Allow-Origin` header, which the browser treats as denied, rather than an error thrown into the request. `maxAge` lets the browser cache the preflight for a day, which removes a round trip from most requests.

## The preflight that failed

A `PATCH` with a JSON body and an `Authorization` header is a "non-simple" request: the browser sends an `OPTIONS` preflight first. My auth middleware was mounted before `cors`, saw an `OPTIONS` request with no token, and returned 401. The browser read the 401 as a failed preflight and blocked the real request. The fix is ordering:

```js
app.use(cors(corsOptions));   // first, so OPTIONS is answered here
app.use(express.json());
app.use("/api", requireAuth, apiRoutes);
```

The `cors` middleware answers `OPTIONS` itself and never reaches `requireAuth`. If you cannot reorder, handle `OPTIONS` explicitly: `app.options("*", cors(corsOptions))`.

## Cookies, and why I stopped using them in the app

The refresh token was an `httpOnly` cookie, which is the right design in a browser. Inside the app, cookies behave inconsistently: iOS's WKWebView drops cross-origin cookies without `SameSite=None; Secure`, and even then treats `capacitor://` as a different site. After a week of intermittent logouts, I moved the app to a bearer-token flow: the refresh token is stored with `@capacitor/preferences` (Keychain on iOS, encrypted shared preferences on Android) and sent in a header to the refresh endpoint. The browser build still uses the cookie. One API, two client strategies, both chosen for where they run.

## Nginx is in front, remember

If Nginx returns an error before the request reaches Express, that error has no CORS headers, and the browser reports it as a CORS failure even though it is really a 502 or a 413. When "CORS error" appears on the phone, check the Nginx error log before touching the allow list; a too-large upload was one of mine.

## Checking from the command line

```bash
curl -s -i -X OPTIONS https://api.growthavenues.in/api/leave \
  -H "Origin: capacitor://localhost" -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: authorization,content-type" | grep -i "access-control"
```

You should see the origin echoed back, the methods, the headers and the max-age. If you see nothing, the origin is not allowed or the request did not reach `cors`.

## Sources

- Capacitor configuration, `server` options: [capacitorjs.com/docs/config](https://capacitorjs.com/docs/config)
- Capacitor CORS guide: [capacitorjs.com/docs/guides/cors-errors](https://capacitorjs.com/docs/guides/cors-errors)
- Express cors middleware: [expressjs.com/en/resources/middleware/cors.html](https://expressjs.com/en/resources/middleware/cors.html)
- Preflight requests on MDN: [developer.mozilla.org/en-US/docs/Glossary/Preflight_request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
- `@capacitor/preferences`: [capacitorjs.com/docs/apis/preferences](https://capacitorjs.com/docs/apis/preferences)
