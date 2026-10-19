---
title: "Image uploads in Next.js: resizing, WebP, and not trusting the client"
description: "Product photos on a food-ordering site arrived at 6 MB each from phone cameras. The pipeline I settled on checks the real file type, resizes on the server with sharp, stores WebP, and keeps the original for the one time you need it."
date: 2027-02-22T03:30:00Z
tags: [nextjs, images, sharp, supabase, security]
keywords: [next.js image upload server action, sharp resize webp node, validate image upload file type, next.js file upload supabase storage, image optimization pipeline]
project: biryani-bazar
image: /blog/stock/camera-1.webp
imageAlt: "Close-up of a camera with a long lens"
imageCredit: "Matthew Hamilton thatsmrbio"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Long-lens_camera_in_close-up_(Unsplash).jpg"
imageLicense: "CC0"
---

Every photo the client uploaded to the Biryani Bazar admin came straight from a phone: 4000 by 3000 pixels, 5 to 7 MB, sometimes sideways because of EXIF rotation. Serving those to a menu page is how a site becomes slow without anyone changing code. The pipeline below fixed it, and the same one runs this portfolio's media library.

## Rules

1. The browser's claimed MIME type is a suggestion. Check the bytes.
2. Resize and convert on the server. Never trust the browser to have done it.
3. Store a web-sized WebP for serving and the original for later re-processing.
4. Cap size and count before any processing starts.

## The server action

```ts
"use server";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function uploadPhoto(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "Images must be 10 MB or smaller" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = await fileTypeFromBuffer(buffer);          // reads magic bytes
  if (!type || !ALLOWED.has(type.mime)) return { ok: false, error: "Only JPEG, PNG, WebP or HEIC" };

  const web = await sharp(buffer)
    .rotate()                                             // apply EXIF orientation, then strip it
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const meta = await sharp(web).metadata();

  const base = `products/${crypto.randomUUID()}`;
  await storage.upload(`${base}.webp`, web, "image/webp");
  await storage.upload(`${base}.${type.ext}`, buffer, type.mime); // original, for re-processing

  return { ok: true, url: storage.publicUrl(`${base}.webp`), width: meta.width, height: meta.height };
}
```

`rotate()` with no arguments is the fix for sideways photos: it reads the EXIF orientation, rotates the pixels to match, and drops the tag so nothing rotates it again. Converting to WebP also strips the rest of the metadata, including GPS coordinates that phones embed, which you do not want to publish.

## Why keep the original

Six months in, the client wanted square thumbnails for a new layout. Because the originals were there, regenerating 400 thumbnails was a script, not a request for photos nobody still had.

## Serving

Store the WebP's width and height with the URL and give them to `next/image`, which then reserves the space and avoids layout shift:

```tsx
<Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 768px) 100vw, 33vw" />
```

`next/image` will still resize per device and serve AVIF where supported, from your already-small WebP, so each request does far less work than it would from the original.

## Limits that stop abuse

- Next.js server actions accept 1 MB bodies by default. Raise it in `next.config.ts` only as far as you need: `experimental: { serverActions: { bodySizeLimit: "12mb" } }`.
- One upload per request. Multi-file uploads loop on the client and call the action once per file, so a single oversized request cannot stall the server.
- Rate limit the action per user if the admin has more than a handful of people.

## HEIC from iPhones

Safari uploads HEIC unless the site asks for JPEG. `sharp` reads HEIC only when built with libheif, which the default npm binary is not. Options: add `accept="image/jpeg,image/png,image/webp"` on the input so iOS converts before upload, which is what I did, or install a sharp build with HEIC support on the server.

## Sources

- sharp: [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/)
- file-type, detection from magic bytes: [github.com/sindresorhus/file-type](https://github.com/sindresorhus/file-type)
- Next.js server actions body size: [nextjs.org/docs/app/api-reference/config/next-config-js/serverActions](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- `next/image`: [nextjs.org/docs/app/api-reference/components/image](https://nextjs.org/docs/app/api-reference/components/image)
- OWASP file upload cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
