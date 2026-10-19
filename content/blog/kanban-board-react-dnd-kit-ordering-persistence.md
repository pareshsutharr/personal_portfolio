---
title: "Building the CRM's lead board: drag and drop with dnd-kit, fractional ordering, and persistence that survives two people moving cards"
description: "A kanban board looks like a weekend project and the dragging is. The hard parts are the order of cards within a column, what happens when two people move cards at once, keyboard access, and not re-rendering five hundred cards on every pixel. How the lead board in the CRM handles each, with the ordering scheme that avoids renumbering every card."
date: 2028-08-07T03:30:00Z
tags: [react, dnd-kit, crm, frontend, ux]
keywords: [react kanban dnd-kit, fractional indexing ordering, drag and drop persist order database, kanban board react performance, dnd-kit keyboard accessibility]
project: growth-avenues-crm
image: /blog/stock/keyboard-3.webp
imageAlt: "Keyboard keys close-up"
imageCredit: "Alexander-design"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Keyboard_Close_Up.jpg"
imageLicense: "CC0"
---

Sales teams think in boards. The lead desk in the CRM is one: columns for stages, cards for leads, dragged from New to Contacted to Qualified to Won or Lost. The first version used a popular drag library and renumbered every card in a column on every drop. With two salespeople moving cards at once, the orders fought each other and cards jumped. The current version fixes that with a different idea of what "position" means.

## The library

dnd-kit, because it is small, it supports keyboard and screen readers out of the box, and it does not own your state; it reports what was dragged where and you decide what that means. The board uses `DndContext`, one `SortableContext` per column, and `useSortable` per card.

```tsx
<DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd}>
  {columns.map((col) => (
    <SortableContext key={col.id} id={col.id} items={col.cardIds} strategy={verticalListSortingStrategy}>
      <Column column={col}>{col.cardIds.map((id) => <Card key={id} id={id} />)}</Column>
    </SortableContext>
  ))}
  <DragOverlay>{activeId ? <CardPreview id={activeId} /> : null}</DragOverlay>
</DndContext>
```

`sensors` includes a `KeyboardSensor` with sortable coordinates, so Space picks up a card, arrows move it, Space drops it, and screen readers announce each step. That came free, and it matters for the HR manager who uses the CRM with a keyboard only.

## Positions: fractional, not integer

Renumbering is the problem. Instead, each card has a `position` string, and a card dropped between two others gets a string that sorts between them:

```ts
import { generateKeyBetween } from "fractional-indexing";
// cards in column sorted by position: a0, a1, a2
// drop between a0 and a1:
const position = generateKeyBetween("a0", "a1");   // "a0V"
// drop at top:
generateKeyBetween(null, "a0");                     // "Zz"
```

The dropped card is the only document that changes. Two people dropping different cards into the same column at the same time each write one document and never collide. Positions grow longer slowly with repeated insertions in the same gap; a nightly job renumbers any column whose longest key passes a length threshold, which has happened twice in a year.

## What a drop sends

```ts
function onEnd({ active, over }) {
  if (!over) return;
  const to = columnOf(over.id);
  const neighbours = neighboursAt(to, over.id, active.id);        // the cards just above and below the drop point
  const position = generateKeyBetween(neighbours.before?.position ?? null, neighbours.after?.position ?? null);
  moveCard.mutate({ id: active.id, stage: to, position });        // optimistic, with rollback, as in the earlier post
}
```

Server side, the move is validated: the stage must be a legal transition for the lead, the user must own or be assigned the lead, and the write is `updateOne({ _id, version }, { stage, position, $inc: { version: 1 } })` so a stale client cannot overwrite a newer move.

## Two people, one board

Every move the server accepts is broadcast over a socket room per team. Other clients receive `{ id, stage, position, version }` and patch their local list; if the incoming version is lower than what they have, they ignore it. Combined with the 30-second refetch, boards converge within a second of a move and are exactly right within half a minute. The sockets post covers the room setup.

## Not rendering five hundred cards per pixel

Three things keep dragging smooth with large boards:

1. **Cards are memoised** and receive only their own id; they read their data from a store by id, so moving one card does not re-render the others.
2. **The drag overlay** renders the moving card once, outside the columns, so the columns do not re-layout on every mouse move.
3. **Columns are virtualised** past sixty cards. Below that, plain lists are fine and simpler.

The Won and Lost columns are collapsed by default and load their cards on expand, which keeps the common view to the few dozen active leads.

## Stage changes are events

Dropping a card on Won is not just a position change. The server records a stage transition in the lead's history, triggers the follow-up task rules, and, for Won, prompts for the closed value. The board is a view on the lead pipeline; the pipeline's rules live on the server and the board respects them by refusing illegal drops before they start, greying out columns the card cannot go to.

## Sources

- dnd-kit: [docs.dndkit.com](https://docs.dndkit.com/)
- dnd-kit sortable preset: [docs.dndkit.com/presets/sortable](https://docs.dndkit.com/presets/sortable)
- Fractional indexing: [github.com/rocicorp/fractional-indexing](https://github.com/rocicorp/fractional-indexing)
- The Figma blog post that popularised the technique: [figma.com/blog/realtime-editing-of-ordered-sequences](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/)
- TanStack Virtual: [tanstack.com/virtual/latest](https://tanstack.com/virtual/latest)
