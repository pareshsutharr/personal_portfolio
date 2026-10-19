---
title: "Testing a Node API without a test database: fixtures and in-memory MongoDB"
description: "The Growth Avenues API has tests that create a real MongoDB in memory, seed a few documents, hit the routes with supertest, and tear it all down in under ten seconds. No shared test database, no leftover rows, no mocks of the driver. Here is the setup."
date: 2027-08-23T03:30:00Z
tags: [testing, nodejs, mongodb, express]
keywords: [mongodb memory server jest, test express api supertest, node api integration tests, test mongoose without database, vitest mongodb]
project: growth-avenues
image: /blog/stock/checklist-1.webp
imageAlt: "Clipboards with paper checklists"
imageCredit: "Unknown"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:USMC-100914-M-0646Q-45.jpg"
imageLicense: "Public domain"
summary: "Start an in-memory MongoDB per test file, seed a few documents, hit the routes with supertest and tear down, all in under ten seconds. No shared test database, no leftover rows and no mocking of the driver, so query bugs are caught."
faq:
  - q: "Why not mock Mongoose in API tests?"
    a: "Most API bugs are in queries and indexes. A real in-memory MongoDB runs the real queries at almost no cost."
  - q: "How do tests avoid interfering with each other?"
    a: "Each test file gets its own in-memory server and clears collections between tests, so order does not matter and they can run in parallel."
  - q: "How are authenticated routes tested?"
    a: "A helper signs a token for a seeded user with the needed role and sets it on the supertest request."
---

The tests I trust most are the ones that run the real route handler against a real database and check the HTTP response. Mocking Mongoose tests your mocks. A shared test database means tests that pass alone and fail together. `mongodb-memory-server` solves both: it downloads a real `mongod` binary once and starts a throwaway instance per test run, in memory.

## Setup

```bash
npm i -D vitest supertest mongodb-memory-server
```

```js
// test/setup.js
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongod;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

```js
// vitest.config.js
export default { test: { setupFiles: ["./test/setup.js"], fileParallelism: false } };
```

`fileParallelism: false` keeps one database per run; with it on, each worker gets its own instance, which is fine too but slower to start. Clearing collections after each test, rather than dropping the database, keeps indexes in place, which matters because unique-index behaviour is part of what you are testing.

## The app must be importable without listening

Separate "build the Express app" from "listen on a port":

```js
// src/app.js
export const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api", requireAuth, apiRoutes);

// src/server.js
import { app } from "./app.js";
app.listen(process.env.PORT);
```

Tests import `app` and never open a port; supertest handles the request in-process.

## Fixtures as functions

```js
// test/fixtures.js
export async function makeUser(overrides = {}) {
  return User.create({ email: `u${Date.now()}${Math.random()}@test.local`, passwordHash: await bcrypt.hash("pass1234", 4), role: "distributor", ...overrides });
}
export function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role, v: user.tokenVersion ?? 0 }, process.env.JWT_SECRET, { expiresIn: "15m" });
}
```

Functions, not JSON files, so each test builds exactly the state it needs and nothing more. The bcrypt cost of 4 makes user creation fast; production uses 12.

## A test that proves the thing that matters

```js
import request from "supertest";
import { app } from "../src/app.js";

test("a distributor only sees their own clients", async () => {
  const a = await makeUser(); const b = await makeUser();
  await Client.create([{ name: "A1", distributor: a.id }, { name: "B1", distributor: b.id }]);

  const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${tokenFor(a)}`);

  expect(res.status).toBe(200);
  expect(res.body.map((c) => c.name)).toEqual(["A1"]);
});

test("staff cannot change settings", async () => {
  const staff = await makeUser({ role: "staff" });
  const res = await request(app).patch("/api/settings").set("Authorization", `Bearer ${tokenFor(staff)}`).send({ x: 1 });
  expect(res.status).toBe(403);
});
```

The first test is the authorisation rule from the JWT post, verified end to end through the real query. If someone later removes the `distributor` filter, this fails, which is the whole point of having it.

## What I test, and what I do not

Test: every authorisation boundary, every state transition in the approval machine, the rate limiter's 429, and any bug that reached production, as a regression test with the ticket number in its name.

Do not test: that Mongoose saves a document, that Express parses JSON, or a controller that only maps a request to a query with no logic of its own. Those tests cost time and catch nothing.

## Speed

A fresh run on the Growth Avenues API: 140 tests in about nine seconds, most of it the first `mongod` start. In CI the binary is cached between runs. Fast enough to run on every commit, which is the only speed that matters.

## Sources

- mongodb-memory-server: [github.com/typegoose/mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server)
- supertest: [github.com/ladjs/supertest](https://github.com/ladjs/supertest)
- Vitest configuration: [vitest.dev/config](https://vitest.dev/config/)
- Testing Express applications: [expressjs.com/en/advanced/best-practice-performance.html](https://expressjs.com/en/advanced/best-practice-performance.html)
