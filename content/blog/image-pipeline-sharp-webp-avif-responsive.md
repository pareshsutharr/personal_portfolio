---
title: "An image pipeline with sharp: WebP and AVIF, responsive sizes, blur placeholders, and 90% smaller pages"
description: "The travel photos on this site's home page were 4 MB JPEGs straight from a phone. Seven of them made the page 28 MB. A sharp script now produces WebP and AVIF at four widths plus a tiny blur placeholder, and the same page is under 2 MB. The script, how the sizes were chosen, the markup that lets the browser pick, and where Next.js's image component fits."
date: 2028-05-29T03:30:00Z
tags: [images, performance, sharp, nextjs, frontend]
keywords: [sharp resize webp avif node, responsive images srcset sizes, blur placeholder sharp, next.js image optimization, reduce image size website]
project: portfolio
image: /blog/stock/abstract-3.webp
imageAlt: "City skyline with light trails"
imageCredit: "Davide Cantelli cant89"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:New_York_skyline_with_light_trails_(Unsplash).jpg"
imageLicense: "CC0"
summary: "A sharp script turns phone photos into WebP and AVIF at four widths plus a tiny blur placeholder, and a picture element with srcset and sizes lets the browser pick the smallest file that covers its slot. The home page went from 28 MB to under 2 MB."
faq:
  - q: "Should I use AVIF or WebP?"
    a: "Both, with AVIF first in the picture element. AVIF is about 40 percent smaller at matching quality and browsers that lack it fall back to WebP."
  - q: "What does the sizes attribute do?"
    a: "It tells the browser how wide the image will be rendered at each viewport, so it can choose the right srcset candidate before layout."
  - q: "When is next/image better than pre-generating files?"
    a: "For images at unpredictable sizes from a CMS or uploads. For static photos in the repo, generating at build time avoids runtime work."
---

Images are most of the bytes on most pages, and this site was no exception until the photos went through a pipeline. The pipeline is one script, run once per new image, that produces everything the page needs.

## The script

```js
// scripts/images.mjs
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const WIDTHS = [480, 960, 1440, 2000];
const SRC = "raw-images", OUT = "public/images";
await mkdir(OUT, { recursive: true });
const manifest = {};

for (const file of await readdir(SRC)) {
  const name = path.parse(file).name;
  const input = sharp(path.join(SRC, file)).rotate();               // apply EXIF orientation, then strip it
  const meta = await input.metadata();
  manifest[name] = { width: meta.width, height: meta.height, sources: {} };

  for (const w of WIDTHS.filter((w) => w <= meta.width)) {
    await input.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(`${OUT}/${name}-${w}.webp`);
    await input.clone().resize({ width: w, withoutEnlargement: true }).avif({ quality: 52, effort: 5 }).toFile(`${OUT}/${name}-${w}.avif`);
    manifest[name].sources[w] = true;
  }
  const blur = await input.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  manifest[name].blurDataURL = `data:image/webp;base64,${blur.toString("base64")}`;
}
await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
```

`rotate()` with no arguments reads the EXIF orientation and bakes it in, so a phone photo shot in portrait does not appear sideways; sharp strips the rest of the metadata by default, which also removes GPS coordinates from the travel photos. The 16-pixel-wide blur is about 300 bytes as a data URI and is inlined in the HTML as the placeholder.

## Choosing widths and qualities

Four widths cover phones at 1x and 2x, laptops, and large screens. More steps give diminishing returns and more files. WebP at 78 and AVIF at 52 look the same to me side by side at 100%; AVIF files come out around 40% smaller than WebP at those settings, and both are a fraction of the JPEG. Setting `effort` to 5 instead of the maximum keeps the script to a few seconds per image.

| Photo, 2000 px wide | Size |
|---|---|
| Original JPEG | 4.1 MB |
| WebP q78 | 310 KB |
| AVIF q52 | 185 KB |

## The markup

```tsx
<picture>
  <source type="image/avif" srcSet={srcset(name, "avif")} sizes={sizes} />
  <source type="image/webp" srcSet={srcset(name, "webp")} sizes={sizes} />
  <img src={`/images/${name}-960.webp`} width={m.width} height={m.height} alt={alt} loading="lazy" decoding="async"
       style={{ backgroundImage: `url(${m.blurDataURL})`, backgroundSize: "cover" }} />
</picture>
```

With `sizes="(min-width: 1024px) 33vw, 100vw"` for a three-column gallery: the browser knows the image will be a third of the viewport on desktop and picks the smallest file that covers it at its pixel density. `width` and `height` reserve the space so nothing jumps when the image lands. The blur shows until it does.

## Where Next.js's Image component fits

`next/image` does the resizing and format negotiation at request time and caches the results, which is ideal for images that come from a CMS or user uploads at unpredictable sizes. This site uses it for project screenshots stored in Supabase storage, with the storage domain in `images.remotePatterns`. The travel photos and backdrops are static files in the repo, so pre-generating them at build is simpler and avoids any runtime work; both approaches are on the same page and the visitor cannot tell.

## Backdrops

The section backgrounds use the same pipeline with one difference: the largest width is 2400 and the quality is lower, since they sit behind a dark overlay. A 2400-wide AVIF backdrop is around 150 KB.

## Lighthouse's view

Before: Largest Contentful Paint 6.8 s on a simulated phone, with "Properly size images" and "Serve images in next-gen formats" as the top two items. After: 1.9 s and neither item listed. The next post walks through the rest of that audit.

## Sources

- sharp: [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/)
- Responsive images, `srcset` and `sizes`: [developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images)
- AVIF and WebP browser support: [caniuse.com/avif](https://caniuse.com/avif)
- Next.js `Image`: [nextjs.org/docs/app/api-reference/components/image](https://nextjs.org/docs/app/api-reference/components/image)
- web.dev on image optimisation: [web.dev/learn/images](https://web.dev/learn/images)
