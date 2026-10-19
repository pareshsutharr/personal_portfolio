---
title: "An org chart in React: tree data, SVG connectors, and export to PDF"
description: "The Growth Avenues HRMS draws the company's reporting lines from the employee table. Building it meant turning a flat list into a tree, laying it out without a charting library, drawing the lines in SVG, and exporting something HR could put in a deck."
date: 2027-07-26T03:30:00Z
tags: [react, svg, hrms, data-structures]
keywords: [react org chart component, build org chart from flat list, tree layout algorithm react, svg connector lines react, export react component to pdf]
project: growth-avenues-hrms
image: /blog/stock/writing-2.webp
imageAlt: "Notebook and pen on a desk next to a laptop"
imageCredit: "Shixart1985"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Person_writing_in_a_notebook_while_sitting_at_a_desk.jpg"
imageLicense: "CC BY 2.0"
summary: "Turn the flat employee list into a tree by reportsTo, lay it out with a simple recursive width calculation, draw connectors in SVG and export to PDF through the same HTML. No charting library, and it handles a few hundred nodes with collapsing branches."
faq:
  - q: "How do I build a tree from a flat list with parent ids?"
    a: "Index by id, then attach each node to its parent's children array; nodes whose parent is missing become roots."
  - q: "How are the connector lines drawn?"
    a: "An SVG overlay with a path from each parent's bottom centre to each child's top centre, computed from the laid-out positions."
  - q: "How is the chart exported for HR?"
    a: "The same HTML is rendered server-side and printed to PDF, with page breaks avoided inside a node."
---

HR asked for an org chart. The employee table already had a `reportsTo` field on every row, so the data existed; it just needed to become a picture. I looked at charting libraries, found them either huge or inflexible about styling, and wrote the layout in about 150 lines. Here is the shape of it.

## Flat list to tree

```ts
type Employee = { id: string; name: string; title: string; reportsTo: string | null };
type Node = Employee & { children: Node[] };

export function buildTree(list: Employee[]): Node[] {
  const byId = new Map<string, Node>(list.map((e) => [e.id, { ...e, children: [] }]));
  const roots: Node[] = [];
  for (const node of byId.values()) {
    const parent = node.reportsTo ? byId.get(node.reportsTo) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);                       // no manager, or manager not found
  }
  for (const n of byId.values()) n.children.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
}
```

One pass to build the map, one to link. Orphans, where the manager left and the row was not updated, become roots rather than vanishing; HR sees them at the top and fixes the data. Guard against a cycle, someone reporting to their own report, with a visited set during layout; it happened once after a bulk import.

## Layout: widths from the bottom up

Each node's width is the sum of its children's widths, or one unit for a leaf. Position children left to right under the parent's centre.

```ts
const NODE_W = 180, NODE_H = 64, GAP_X = 24, GAP_Y = 56;
type Laid = Node & { x: number; y: number; w: number };

function measure(n: Node): number {
  const kids = n.children.map(measure);
  const w = kids.length ? kids.reduce((a, b) => a + b, 0) + GAP_X * (kids.length - 1) : NODE_W;
  (n as Laid).w = w;
  return w;
}

function place(n: Node, left: number, depth: number, out: Laid[]) {
  const node = n as Laid;
  node.x = left + node.w / 2 - NODE_W / 2;
  node.y = depth * (NODE_H + GAP_Y);
  out.push(node);
  let cursor = left;
  for (const c of n.children) { place(c, cursor, depth + 1, out); cursor += (c as Laid).w + GAP_X; }
}
```

`measure` then `place` for each root, offsetting roots horizontally. The result is a list of nodes with absolute `x` and `y`, which is all rendering needs.

## Rendering: HTML cards, SVG lines

Cards are plain HTML absolutely positioned, so they can hold avatars, hover states and links. The connectors are one SVG behind them:

```tsx
<div className="relative" style={{ width, height }}>
  <svg className="absolute inset-0" width={width} height={height} aria-hidden>
    {nodes.flatMap((n) => n.children.map((c) => {
      const kid = c as Laid;
      const x1 = n.x + NODE_W / 2, y1 = n.y + NODE_H;
      const x2 = kid.x + NODE_W / 2, y2 = kid.y;
      const ym = y1 + GAP_Y / 2;
      return <path key={`${n.id}-${kid.id}`} d={`M${x1},${y1} V${ym} H${x2} V${y2}`} fill="none" stroke="#2a2a2a" strokeWidth={1.5} />;
    }))}
  </svg>
  {nodes.map((n) => <Card key={n.id} node={n} style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }} />)}
</div>
```

The path is three straight segments: down from the parent, across, down to the child. Orthogonal lines read as an org chart; curves read as a mind map.

## Big companies

Growth Avenues has a few hundred people across branches, which fits on a wide scrollable canvas. For thousands, collapse branches below a depth and expand on click; the layout functions above work unchanged on a subtree. Pan and zoom came from CSS `transform` on the container and a small wheel handler, no library.

## Export

HR wanted it in a deck. The reliable route was a server-side render to PDF with headless Chrome, the same way salary slips are produced, with `@media print` rules that hide the toolbar and set the page to landscape A3. A client-side "download as image" with `html-to-image` worked for small charts and produced blank areas for large ones, which is a known limit of that approach.

## Sources

- SVG `path` commands: [developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d)
- The Reingold-Tilford tidy tree algorithm, for when the simple layout is not enough: [reingold.co/tidier-drawings.pdf](https://reingold.co/tidier-drawings.pdf)
- Puppeteer `page.pdf` landscape and format options: [pptr.dev/api/puppeteer.pdfoptions](https://pptr.dev/api/puppeteer.pdfoptions)
