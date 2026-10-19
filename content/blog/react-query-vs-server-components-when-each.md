---
title: "Server components or React Query? Where each one earns its place in a Next.js app"
description: "The CRM dashboard fetches on the server and renders once. The kanban board fetches on the client and refetches every thirty seconds. Both are in the same Next.js app, and the choice was not about fashion. The question I ask for each screen, and the shape of the code on each side of the answer."
date: 2028-01-24T03:30:00Z
tags: [react, nextjs, react-query, data-fetching, frontend]
keywords: [react query vs server components, when to use react query next.js app router, server components data fetching, tanstack query next.js, client side fetching next.js]
project: growth-avenues-crm
image: /blog/stock/servers-3.webp
imageAlt: "Close-up of blade servers in a rack"
imageCredit: "NOIRLab/NSF/AURA/T. Slovinský"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:NOIRLab_HQ_Server_Racks_(6V6A0404-CC).jpg"
imageLicense: "CC BY 4.0"
summary: "Fetch on the server with React server components for screens that do not change while someone looks at them, and use a client-side query library for live screens such as boards and inboxes that other people change. The deciding question is how long the page stays open and who else edits the data."
faq:
  - q: "Did server components make React Query unnecessary?"
    a: "No. Server components win for read-and-leave pages; a query library wins for long-lived screens that need refetching, optimistic updates and rollback."
  - q: "Can both be used in one Next.js app?"
    a: "Yes. The shell page is a server component that handles layout and permissions, and only the live region mounts a client component driven by queries."
  - q: "Should I hydrate the client cache with server data?"
    a: "Only where a spinner on first load matters, such as an inbox. For a board people keep open all day it adds complexity for little gain."
---

For a while there was a camp that said server components made client-side data libraries obsolete, and a camp that said server components were a step back. Having shipped a CRM with both, the honest answer is that they solve different problems and the right question is about the screen, not the stack.

## The question

**Does this screen change while the person is looking at it?**

If no, fetch on the server, render HTML, and send it. The client dashboard, the client profile, the reports: a person opens them, reads, leaves. Server components, no client JavaScript for the data, fast first paint, cached where safe.

If yes, fetch on the client with a library that owns caching, refetching and mutations. The lead kanban that several people drag cards around on, the inbox that gets new messages, the live attendance board: the page is a living view of changing data, and the fetching logic is the feature.

## Server side: a client's profile page

```tsx
// app/(app)/clients/[id]/page.tsx
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, holdings, notes] = await Promise.all([
    getClient(id), getHoldings(id), getNotes(id),
  ]);
  if (!client) notFound();
  return (
    <>
      <ClientHeader client={client} />
      <HoldingsTable rows={holdings} />
      <Notes initial={notes} clientId={id} />   {/* client component for the add-note form */}
    </>
  );
}
```

Three queries in parallel on the server, one HTML response, no loading spinners. A mutation such as adding a note is a server action that calls `revalidatePath` so the next render is fresh. The `Notes` component takes the server-fetched list as initial data and appends optimistically; it does not refetch on its own, because notes do not change under the person.

## Client side: the lead board

```tsx
"use client";
export function LeadBoard() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["leads", "board"],
    queryFn: () => api.get("/leads/board"),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const move = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.patch(`/leads/${id}`, { stage }),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["leads", "board"] });
      const prev = qc.getQueryData(["leads", "board"]);
      qc.setQueryData(["leads", "board"], (old) => moveCard(old, id, stage));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["leads", "board"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads", "board"] }),
  });
  return <Board columns={data?.columns ?? []} onMove={(id, stage) => move.mutate({ id, stage })} />;
}
```

The card moves the instant it is dropped, rolls back if the server rejects, and the board catches up with what colleagues did every thirty seconds and whenever the tab regains focus. Writing that by hand with `useEffect` and `useState` is possible and nobody who has tried it twice does it a third time.

## The split in one app

The CRM's routing reflects the split. `/clients/*` and `/reports/*` are server-rendered and mostly static per request. `/leads/board`, `/inbox` and `/attendance/live` are client-rendered shells that mount a query-driven component. The shell page itself is still a server component, so the layout, navigation and permission check happen on the server; only the live region is client code.

Hydrating the client cache with server data is possible and the library supports it. I use it on the inbox, where the first list comes from the server render and the client takes over for new messages. For the kanban it was not worth the complexity: a 300 ms spinner on a board people keep open all day is nothing.

## The things that decided it

- **Who else changes the data while you look?** Other people, a device, a job: client.
- **How long is the page open?** Seconds: server. Minutes or all day: client.
- **Does the interaction need instant feedback with rollback?** Client.
- **Is it something to share by link, print, or index?** Server.
- **Is the data big and the view a slice?** Server, with pagination in the URL.

When two answers disagree, the open-duration one usually wins.

## Sources

- Next.js data fetching: [nextjs.org/docs/app/getting-started/fetching-data](https://nextjs.org/docs/app/getting-started/fetching-data)
- TanStack Query: [tanstack.com/query/latest/docs/framework/react/overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- TanStack Query with the App Router: [tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- Optimistic updates: [tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- React server components, explained: [react.dev/reference/rsc/server-components](https://react.dev/reference/rsc/server-components)
