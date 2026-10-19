---
title: "Express error handling that does not leak stack traces"
description: "One error middleware, one HttpError class, and a rule about what the client is allowed to see. How the Growth Avenues API went from random 500s with stack traces in the body to consistent JSON errors that are safe to show and easy to log."
date: 2027-10-04T03:30:00Z
tags: [express, nodejs, security, api]
keywords: [express error handling middleware, express async errors, custom error class node, hide stack trace production express, api error response format]
project: growth-avenues
image: /blog/stock/code-2.webp
imageAlt: "Source code on a dark monitor"
imageCredit: "luis gomes"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Pexels-luis-gomes-546819.jpg"
imageLicense: "CC0"
---

Early on, a failed MongoDB query in the Growth Avenues API returned a 500 with the full stack trace, including file paths and the query, to whoever made the request. A client saw it once. That was enough to write the error handling properly, which turned out to be about forty lines.

## One error class

```js
export class HttpError extends Error {
  constructor(status, message, { code, details, expose = status < 500 } = {}) {
    super(message);
    this.status = status;
    this.code = code ?? null;       // machine-readable: "validation_failed", "not_found"
    this.details = details ?? null; // field errors, safe to show
    this.expose = expose;           // may the client see the message?
  }
}
```

A 404 or a 403 has a message the client should see. A 500 does not: whatever went wrong is the server's problem and its message may contain internals. `expose` encodes that rule, defaulting to "4xx yes, 5xx no".

## Throw, do not respond, in handlers

Handlers throw and let one place decide the response:

```js
router.get("/clients/:id", requireAuth, async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, distributor: req.user.id }).lean();
  if (!client) throw new HttpError(404, "Client not found", { code: "not_found" });
  res.json(client);
});
```

Express 5 catches rejected promises from async handlers automatically. On Express 4, wrap handlers or use `express-async-errors` once at startup, or every thrown error in an async handler hangs the request.

## The error middleware

Registered last, after every route:

```js
import { log } from "./log.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Normalise common library errors into HttpErrors.
  let e = err;
  if (err.name === "ValidationError") e = new HttpError(400, "Invalid input", { code: "validation_failed", details: formatMongooseErrors(err) });
  else if (err.name === "CastError") e = new HttpError(400, "Invalid id", { code: "invalid_id" });
  else if (err.code === 11000) e = new HttpError(409, "Already exists", { code: "duplicate" });
  else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") e = new HttpError(401, "Session expired", { code: "unauthorized" });
  else if (err.type === "entity.too.large") e = new HttpError(413, "Request too large", { code: "too_large" });
  else if (!(err instanceof HttpError)) e = new HttpError(500, "Something went wrong", { code: "internal" });

  if (e.status >= 500) log.error({ err, route: req.path, method: req.method }, "unhandled error");
  else if (e.status >= 400) log.info({ status: e.status, code: e.code, route: req.path }, "request failed");

  res.status(e.status).json({
    error: e.expose ? e.message : "Something went wrong",
    code: e.code,
    ...(e.details ? { details: e.details } : {}),
    requestId: res.getHeader("X-Request-Id"),
  });
}

app.use(errorHandler);
```

What the client gets is always the same shape: `error`, `code`, optional `details`, and the request id. What the log gets for a 500 is the full error with its stack, tied to the same request id. Support can ask for the id; the stack never leaves the server.

## The 404 that is not an error

Unknown routes should not fall through to a default HTML page:

```js
app.use((req, res) => res.status(404).json({ error: "Not found", code: "not_found" }));
app.use(errorHandler);
```

## Validation errors are the common case

Zod and Mongoose both produce structured field errors. Flatten them into `{ field: ["message"] }` so forms can highlight the right inputs:

```js
function formatMongooseErrors(err) {
  return Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
}
```

The frontend's form helper reads `details` and shows messages under fields, and the generic `error` string in a toast. One contract, every form.

## Process-level safety nets

```js
process.on("unhandledRejection", (reason) => { log.error({ err: reason }, "unhandled rejection"); });
process.on("uncaughtException", (err) => { log.fatal({ err }, "uncaught exception"); process.exit(1); });
```

An uncaught exception leaves the process in an unknown state; exit and let PM2 restart it. An unhandled rejection is logged and the process continues, because most of them are a forgotten `await` on a non-critical path.

## Sources

- Express error handling: [expressjs.com/en/guide/error-handling.html](https://expressjs.com/en/guide/error-handling.html)
- Express 5 and async handlers: [expressjs.com/en/guide/migrating-5.html#rejected-promises](https://expressjs.com/en/guide/migrating-5.html#rejected-promises)
- Node process events: [nodejs.org/api/process.html#event-uncaughtexception](https://nodejs.org/api/process.html#event-uncaughtexception)
- OWASP error handling cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
