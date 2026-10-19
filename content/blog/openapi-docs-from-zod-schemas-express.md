---
title: "API documentation that cannot go stale: OpenAPI generated from the Zod schemas the routes already use"
description: "A client's mobile team asked for API docs. The hand-written ones were wrong within a week. Now the OpenAPI document is generated from the same Zod schemas that validate every request and response, served at /docs with a UI, checked in CI so a route without a schema fails the build, and used to generate the mobile team's TypeScript client. The setup and what it changed."
date: 2028-09-25T03:30:00Z
tags: [openapi, zod, express, api, documentation]
keywords: [openapi from zod schemas, zod-to-openapi express, generate api docs express automatically, openapi typescript client generation, swagger ui express zod]
project: growth-avenues
image: /blog/stock/folders-1.webp
imageAlt: "Stack of paper documents"
imageCredit: "Niklas Bildhauer (who also is User gerolsteiner91."
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:FileStack.jpg"
imageLicense: "CC BY-SA 2.0"
---

Documentation that is written separately from the code is a second implementation of the API, and it drifts. The validation post put a Zod schema on every route. That schema already says what the route accepts and returns. Turning it into OpenAPI means the docs are a build artefact, and a wrong doc is a build failure.

## Registering routes with their schemas

```ts
import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);
export const registry = new OpenAPIRegistry();

const ClientSchema = z.object({
  id: z.string().openapi({ example: "66f1a2…" }),
  name: z.string().openapi({ example: "Rahul Mehta" }),
  city: z.string().optional(),
  createdAt: z.string().datetime(),
}).openapi("Client");

export const getClient = route({
  method: "get", path: "/clients/{id}", tags: ["Clients"], summary: "Get a client by id",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: ClientSchema, 404: ErrorSchema },
  handler: async (req, res) => { /* ... */ },
});
```

The `route()` helper is thirty lines of mine: it registers the path, method, request and response schemas with the registry, builds the Express handler with the `validate` middleware from the validation post, and returns something `router.use` can mount. One declaration, three uses: validation, documentation, and the response type.

Responses are validated too, in development and test only, so a handler that returns a shape not matching its declared schema fails loudly before it ships, and the docs are guaranteed to describe what the API really returns.

## Generating the document

```ts
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
export function buildOpenApi() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "Growth Avenues API", version: process.env.GIT_SHA ?? "dev" },
    servers: [{ url: "https://api.growthavenues.in" }],
    security: [{ bearerAuth: [] }],
  });
}
app.get("/openapi.json", (req, res) => res.json(buildOpenApi()));
app.use("/docs", scalarUi({ spec: { url: "/openapi.json" } }));     // or swagger-ui-express
```

`/docs` shows a browsable UI with every route, its parameters, example bodies and responses, and a "try it" button that sends real requests with a token pasted in. The mobile team used it from day one and stopped asking questions in chat.

## CI: every route must be registered

```ts
// tests/openapi.test.ts
test("every mounted route is documented", () => {
  const mounted = listExpressRoutes(app);                           // walks app._router
  const documented = new Set(Object.keys(buildOpenApi().paths).flatMap((p) => methodsFor(p)));
  const missing = mounted.filter((r) => !documented.has(r) && !r.startsWith("/internal"));
  expect(missing).toEqual([]);
});
```

Add a route without going through `route()` and the build fails with its path in the message. That is the mechanism that keeps the docs complete, not discipline.

The generated document is also committed as `openapi.json` and the test fails if it differs from a fresh build, so a schema change shows up in the pull request diff as a readable change to the contract.

## The mobile team's client

```bash
npx openapi-typescript https://api.growthavenues.in/openapi.json -o src/api/schema.d.ts
```

Types for every path, parameter and response, generated from the document. With `openapi-fetch` the calls are typed end to end: a wrong field name in the app is a compile error, not a 400 at runtime. When the API adds a field, regenerating the types shows the mobile team exactly what changed.

## Versioning and breaking changes

The document carries the git SHA. A breaking change, a removed field or a changed type, is detected by running an OpenAPI diff tool against the previous committed document in CI and failing unless the pull request is labelled `breaking`. That label triggers a note to the mobile team. In a year it has fired twice, both on purpose.

## What it is not

It is not prose. The `/docs` page explains each route; it does not explain the authentication flow, the webhook contract or the pagination convention. Those live in a short `API.md` next to the generated document, with links into it. Generated reference plus a hand-written guide of a few pages has been the right split.

## Sources

- zod-to-openapi: [github.com/asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- OpenAPI 3.1 specification: [spec.openapis.org/oas/v3.1.0](https://spec.openapis.org/oas/v3.1.0)
- openapi-typescript and openapi-fetch: [openapi-ts.dev](https://openapi-ts.dev/)
- Scalar API reference UI: [github.com/scalar/scalar](https://github.com/scalar/scalar)
- oasdiff for breaking-change detection: [github.com/oasdiff/oasdiff](https://github.com/oasdiff/oasdiff)
