---
title: "Optimistic UI that rolls back honestly: useOptimistic, server actions, and the cases where you should not"
description: "Marking a message read, approving a leave request, moving a lead. The person clicks and the screen should change now, not after a round trip. How this works with React's useOptimistic and server actions, how it recovers when the server says no, and the two operations I deliberately keep pessimistic."
date: 2028-01-31T03:30:00Z
tags: [react, nextjs, ux, frontend, server-actions]
keywords: [useOptimistic react, optimistic update server action next.js, optimistic ui rollback, react optimistic update pattern, useTransition server action]
project: portfolio
image: /blog/stock/hands-2.webp
imageAlt: "Two people shaking hands"
imageCredit: "Lucas"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Shake_hand.jpg"
imageLicense: "Public domain"
summary: "React's useOptimistic shows the hoped-for state inside a transition while a server action runs and reverts automatically if the action fails; return a result from the action and show a toast so the rollback is explained. Keep money, deletes and server-decided outcomes pessimistic."
faq:
  - q: "What happens to an optimistic update if the server action throws?"
    a: "React discards the optimistic state and the real, server-rendered value shows again, which is the rollback. Add a toast so the flicker is explained."
  - q: "Why must setOptimistic be called inside startTransition?"
    a: "useOptimistic is tied to a pending transition; calling it outside one is an error and the optimistic value would have no lifetime."
  - q: "When should I not use optimistic UI?"
    a: "For payments, destructive actions and anything where the server computes the outcome, such as an approval that may be rejected for insufficient balance."
---

The admin inbox on this site marks a message as read when it is opened. The first version waited for the server action to finish before updating the unread badge, which was about 400 ms on a cold function. It felt broken. The current version updates instantly and only shows a difference if the server disagrees. The code for that is small, and the rules around it matter more than the code.

## The basic shape

```tsx
"use client";
import { useOptimistic, useTransition } from "react";
import { markRead } from "@/lib/actions/messages";

export function MessageList({ messages }: { messages: Message[] }) {
  const [optimistic, setOptimistic] = useOptimistic(messages, (state, id: string) =>
    state.map((m) => (m.id === id ? { ...m, read: true } : m))
  );
  const [, startTransition] = useTransition();

  function open(id: string) {
    startTransition(async () => {
      setOptimistic(id);          // instant
      await markRead(id);         // server action; revalidates the page on success
    });
  }
  return optimistic.map((m) => <Row key={m.id} message={m} onOpen={() => open(m.id)} />);
}
```

`useOptimistic` takes the real value from the server render and a reducer that produces the hopeful version. The hopeful version is shown while the transition is pending. When the action completes and the page revalidates, the real value replaces it. If the action throws, React discards the optimistic state and the real value shows again, which is the rollback, for free.

The `startTransition` wrapper is required; calling `setOptimistic` outside a transition is an error.

## Telling the person it rolled back

Silent rollback is confusing: the badge went to 3, then back to 4, and nothing said why. The action returns a result rather than throwing, and the component reacts:

```tsx
startTransition(async () => {
  setOptimistic(id);
  const result = await markRead(id);
  if (!result.ok) toast.error(result.error ?? "Could not update. Try again.");
});
```

The action still revalidates, so the list is correct; the toast explains the flicker.

## Lists that add

Adding an item optimistically needs a temporary id and a pending flag so the row can look provisional:

```tsx
const [optimistic, add] = useOptimistic(notes, (state, text: string) => [
  { id: `tmp-${Date.now()}`, text, pending: true, createdAt: new Date().toISOString() }, ...state,
]);
// <Row className={note.pending ? "opacity-60" : ""} />
```

The temporary row fades slightly. When the server responds and the page revalidates, the real note with its real id replaces it. Keying by the temporary id is fine because the whole list is replaced on revalidation.

## Where this is not used

**Payments and anything with money.** "Paid" must only ever appear after the server says so. The button shows a spinner and the page waits.

**Destructive actions.** Deleting a project in the admin shows a confirmation, then a pending state, then the result. An optimistic delete that rolls back is more alarming than a 400 ms wait.

**Anything where the server computes the outcome.** Approving a leave request also recalculates balances and may reject for insufficient balance. Showing "approved" and then "rejected" is worse than a short wait. The approval button goes pessimistic with a clear loading state.

The rule: optimistic when the outcome is nearly certain and the cost of being wrong is a flicker; pessimistic when the server decides or the action cannot be undone.

## Double submits

A fast click twice fires the action twice. The transition's pending state disables the control:

```tsx
const [pending, startTransition] = useTransition();
<button disabled={pending} aria-busy={pending}>Approve</button>
```

And the server action is idempotent anyway: marking a read message read again is a no-op with a filter on the prior state.

## Sources

- React `useOptimistic`: [react.dev/reference/react/useOptimistic](https://react.dev/reference/react/useOptimistic)
- React `useTransition`: [react.dev/reference/react/useTransition](https://react.dev/reference/react/useTransition)
- Next.js server actions and revalidation: [nextjs.org/docs/app/getting-started/updating-data](https://nextjs.org/docs/app/getting-started/updating-data)
- Nielsen Norman Group on response time limits: [nngroup.com/articles/response-times-3-important-limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
