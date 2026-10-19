---
title: "Playwright end-to-end tests for the five flows that must never break, and nothing else"
description: "A full E2E suite for a 40-page admin is a maintenance job of its own. The HRMS has nine Playwright tests. They cover login, submitting and approving leave, running payroll, exporting attendance and the biometric sync status, which are the flows whose failure means a phone call. How they are written to be stable, how they get test data, and why they run on pull requests only when relevant files change."
date: 2028-08-28T03:30:00Z
tags: [testing, playwright, e2e, ci, nodejs]
keywords: [playwright e2e tests next.js, playwright test critical user flows, playwright auth state reuse, playwright seed test data, flaky e2e tests fix]
project: growth-avenues-hrms
image: /blog/stock/checklist-1.webp
imageAlt: "Clipboards with paper checklists"
imageCredit: "Unknown"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:USMC-100914-M-0646Q-45.jpg"
imageLicense: "Public domain"
summary: "Nine Playwright tests cover the five flows whose failure means a phone call: login with TOTP, leave submission and approval, payroll, exports and biometric status. Role-based locators, auto-waiting assertions, per-test seeding and reused auth state keep them stable, and they run only when relevant files change."
faq:
  - q: "How many end-to-end tests should a small team have?"
    a: "Enough to cover the flows whose breakage gets you called. For the HRMS that is nine tests in about four minutes; hundreds would be a maintenance job of their own."
  - q: "How do I avoid logging in with TOTP in every test?"
    a: "A setup project logs in once per role with fixed test secrets and saves storage state; fixtures create pages from that state."
  - q: "What causes most flaky Playwright tests?"
    a: "Clicking during an animation and seeded dates landing on weekends. Wait for the end state rather than sleeping, and seed explicit dates."
---

Unit tests cover functions and the API tests cover routes. What neither covers is "an HR executive can approve a leave request in the browser and the balance updates". That is what end-to-end tests are for, and the mistake is writing hundreds of them. The HRMS has nine, chosen by asking: if this breaks on a Monday morning, does someone call me?

## The five flows

1. **Login** with password and TOTP, lands on the dashboard.
2. **Leave**: employee submits, manager sees it in the queue, approves, balance decreases.
3. **Payroll**: run for a month on a seeded department, slips generated, one opens as PDF.
4. **Export**: attendance Excel for a date range downloads and has the expected row count.
5. **Biometric status**: the devices page shows the last sync time and a healthy state.

Nine tests because leave and payroll each have a happy path and one failure path (insufficient balance; locked month).

## Stable by construction

```ts
// tests/e2e/leave.spec.ts
import { test, expect } from "./fixtures";

test("employee submits leave and manager approves it", async ({ employeePage, managerPage, seed }) => {
  const emp = await seed.employee({ leaveBalance: { casual: 5 } });

  await employeePage.goto("/leave/new");
  await employeePage.getByLabel("Leave type").selectOption("casual");
  await employeePage.getByLabel("From").fill("2028-09-04");
  await employeePage.getByLabel("To").fill("2028-09-05");
  await employeePage.getByLabel("Reason").fill("Family function in Ahmedabad");
  await employeePage.getByRole("button", { name: "Submit request" }).click();
  await expect(employeePage.getByRole("status")).toHaveText(/submitted/i);

  await managerPage.goto("/approvals");
  const row = managerPage.getByRole("row", { name: new RegExp(emp.name) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row).toContainText("Approved");

  await employeePage.goto("/leave");
  await expect(employeePage.getByTestId("balance-casual")).toHaveText("3");
});
```

Everything is located by role and label, which is what a person sees, and which breaks only when the UI changes in a way a person would notice. No CSS selectors, no `nth-child`. Assertions use Playwright's auto-waiting `expect`, never `waitForTimeout`. Each test seeds its own data through an API only enabled in the test environment, so tests do not share state and can run in parallel.

## Auth once, reuse everywhere

Logging in with TOTP in every test is slow and makes TOTP the thing that fails. A setup project logs in once per role and saves the storage state:

```ts
// playwright.config.ts
projects: [
  { name: "setup", testMatch: /auth\.setup\.ts/ },
  { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
]
// auth.setup.ts
setup("login as manager", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_MANAGER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_MANAGER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Code").fill(authenticator.generate(process.env.E2E_MANAGER_TOTP!));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.context().storageState({ path: "tests/.auth/manager.json" });
});
```

The fixtures file creates `employeePage` and `managerPage` from the saved states. The test environment has fixed TOTP secrets for the E2E accounts; production does not know them.

## Downloads and PDFs

```ts
const download = page.waitForEvent("download");
await page.getByRole("button", { name: "Export Excel" }).click();
const file = await (await download).path();
const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(file!);
expect(wb.getWorksheet("Attendance")!.rowCount).toBe(1 + seededRows);
```

The export is checked by opening it, not by trusting that a download happened. The PDF test checks the response's content type and that the first page's text, extracted with pdf-parse, includes the employee's name and the month.

## When it runs

Nine tests take about four minutes against a freshly started app with a seeded database. They run:

- On every pull request that touches `apps/web`, `apps/api` or `packages/ui`. A docs change does not trigger them.
- On `main` after merge, before deploy.
- Nightly against staging, with real integrations in sandbox mode, which is the run that catches a vendor changing something.

A failure on `main` blocks the deploy. A failure nightly sends a message and someone looks in the morning.

## Flakiness policy

A test that fails without a code change is quarantined the same day, with a ticket, and fixed or deleted within a week. The usual causes have been an animation covering a button during a click, fixed by waiting for the animation's end state rather than adding a sleep, and a seeded date landing on a weekend, fixed by seeding with explicit dates. The suite has been green for months, which is the only state in which anyone trusts it.

## Sources

- Playwright: [playwright.dev/docs/intro](https://playwright.dev/docs/intro)
- Locators and the priority of role-based selectors: [playwright.dev/docs/locators](https://playwright.dev/docs/locators)
- Authentication state reuse: [playwright.dev/docs/auth](https://playwright.dev/docs/auth)
- Downloads: [playwright.dev/docs/downloads](https://playwright.dev/docs/downloads)
- Google's testing pyramid article, on keeping E2E small: [testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
