---
title: "A command palette for the admin: Ctrl+K to find any record or run any action, built with cmdk"
description: "The HRMS admin has forty pages and three thousand employees. Finding one person was five clicks. A command palette made it two keystrokes and a name. How it is built with cmdk, how search across records is backed by the search engine, how actions are registered by the pages that own them, and the keyboard and focus details that make it feel right."
date: 2028-08-14T03:30:00Z
tags: [react, ux, cmdk, admin, frontend]
keywords: [command palette react cmdk, ctrl k search admin panel, command palette actions registry react, keyboard shortcuts admin dashboard, global search admin react]
project: growth-avenues-hrms
image: /blog/stock/search-1.webp
imageAlt: "Magnifying glass over a postage stamp"
imageCredit: "Heptagon"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Magnifying_glass2.jpg"
imageLicense: "Public domain"
---

Every tool people use all day grows a Ctrl+K. Code editors, Slack, Linear, Notion. The HRMS admin got one after watching an HR executive navigate to an employee's leave balance: sidebar, Employees, search, click, Leave tab. Now: Ctrl+K, type the name, Enter, type "leave", Enter. It took two days and has been the most-mentioned feature since.

## The shell

cmdk gives a filterable, keyboard-navigable list with proper ARIA roles and nothing else. The look is yours.

```tsx
"use client";
import { Command } from "cmdk";

export function Palette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<string[]>([]);          // nested pages: [] | ["employee:123"]
  useHotkey("mod+k", () => setOpen((o) => !o));

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command palette" shouldFilter={false}
      onKeyDown={(e) => { if (e.key === "Backspace" && !query && pages.length) setPages((p) => p.slice(0, -1)); }}>
      <Command.Input value={query} onValueChange={setQuery} placeholder={pages.length ? "Action…" : "Search employees, pages, actions…"} autoFocus />
      <Command.List>
        <Command.Empty>Nothing found.</Command.Empty>
        {pages.length === 0 ? <RootResults query={query} onPick={...} /> : <RecordActions page={pages.at(-1)!} onDone={() => setOpen(false)} />}
      </Command.List>
    </Command.Dialog>
  );
}
```

`shouldFilter={false}` because the results come from the server and are already ranked; cmdk's own filter would re-sort them. Backspace on an empty input pops a nested page, which is how "find employee, then act on them" works.

## Three kinds of results

**Pages.** A static list: "Employees", "Attendance", "Payroll › Run payroll", with their routes. Filtered client-side by a simple fuzzy match. Always present, so the palette works as navigation even when the search backend is slow.

**Records.** Employees, departments, pending leave requests. Typed query goes to the search endpoint, debounced at 120 ms, with the previous request aborted:

```ts
const results = useQuery({ queryKey: ["palette", q], queryFn: ({ signal }) => api.get(`/search?q=${encodeURIComponent(q)}`, { signal }), enabled: q.length >= 2, staleTime: 30_000 });
```

The endpoint is the same Meilisearch index from the search post, with an extra `kind` field so results group under headings.

**Actions.** "Run payroll for July", "Export attendance", "Create employee". Some are global; some belong to a record. The pages that own them register them:

```ts
// in the Employee page's module
registerActions("employee", (emp) => [
  { id: "leave", label: "View leave balance", run: () => router.push(`/employees/${emp.id}/leave`) },
  { id: "slip", label: "Download latest salary slip", run: () => download(`/employees/${emp.id}/slips/latest`), perm: "payroll.read" },
  { id: "deactivate", label: "Mark as exited…", run: () => openDialog("exit", emp), perm: "employees.write", danger: true },
]);
```

A registry keyed by record kind. The palette never knows what actions exist; it asks the registry for the record's kind and filters by the user's permissions. Adding a feature to a page adds its actions in the same file, so the palette stays complete without a central list going stale.

## Keyboard and focus

- `mod+k` toggles, Escape closes, and focus returns to whatever had it before the palette opened. Losing focus to the body on close is the most common command-palette bug and the one people notice without being able to say why.
- Arrow keys move the highlight; Enter runs; `mod+Enter` opens a record in a new tab.
- Recent selections are stored per user and shown when the input is empty, so the three people someone deals with every day are one keystroke away.
- The dialog traps focus and is `aria-modal`, which cmdk's dialog handles.

## Dangerous actions confirm

"Mark as exited" opens the normal confirmation dialog; the palette is a faster route to the same dialog, not a way around it. Actions flagged `danger` render in the warning colour and never run on a single Enter.

## What it did to the sidebar

Nothing, deliberately. Some people navigate by clicking and always will. The palette is an accelerator for people who want one, and the first-week usage was about a third of admin users, growing to over half by month three as people saw colleagues use it.

## Sources

- cmdk: [cmdk.paco.me](https://cmdk.paco.me/)
- WAI-ARIA combobox pattern, which a palette is a form of: [w3.org/WAI/ARIA/apg/patterns/combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- WAI-ARIA dialog pattern and focus return: [w3.org/WAI/ARIA/apg/patterns/dialog-modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- Linear on command menus as a product principle: [linear.app/docs/keyboard-shortcuts](https://linear.app/docs/keyboard-shortcuts)
