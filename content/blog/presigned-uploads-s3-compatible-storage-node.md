---
title: "File uploads that skip your server: presigned URLs to S3-compatible storage from Node"
description: "KYC documents on the Growth Avenues portal used to pass through the API, which meant the API's memory and bandwidth were the upload limit. Presigned URLs let the browser upload straight to object storage with a short-lived permission. The flow, the code for S3 and compatible providers, and the checks that keep it safe."
date: 2027-10-18T03:30:00Z
tags: [nodejs, s3, uploads, security, aws]
keywords: [presigned url upload node, s3 presigned post browser upload, direct upload to s3 from browser, cloudflare r2 presigned url node, upload large files without server]
project: growth-avenues
image: /blog/stock/code-1.webp
imageAlt: "Laptop showing a code editor"
imageCredit: "Tirza van Dijk tirzavandijk"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Laptop_coding_programs_(Unsplash).jpg"
imageLicense: "CC0"
---

A client uploading a 20 MB bank statement through the API ties up a Node process for the duration and doubles the bandwidth, once in and once out to storage. Multiply by a busy onboarding week and the API slows for everyone. Presigned URLs remove the API from the path: it signs a permission, the browser uploads directly to storage, and the API only hears about it when the file is there.

## The flow

1. Browser asks the API: "I want to upload `statement.pdf`, 18 MB, type `application/pdf`, for KYC."
2. API checks the user, the type and the size, picks a key, and returns a presigned URL valid for a few minutes.
3. Browser `PUT`s the file to that URL.
4. Browser tells the API "done". The API verifies the object exists and records it.

The storage credentials never leave the server. The browser gets one URL, for one key, for one method, for five minutes.

## Signing on the server

This works for AWS S3 and for S3-compatible services like Cloudflare R2, Backblaze B2 and DigitalOcean Spaces; only the endpoint changes.

```js
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,            // e.g. https://<account>.r2.cloudflarestorage.com
  credentials: { accessKeyId: process.env.S3_KEY, secretAccessKey: process.env.S3_SECRET },
});

const ALLOWED = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const MAX_BYTES = 25 * 1024 * 1024;

router.post("/uploads/sign", requireAuth, validate(signSchema), async (req, res) => {
  const { contentType, size, purpose } = req.validated.body;
  const ext = ALLOWED[contentType];
  if (!ext) throw new HttpError(400, "Only PDF, JPEG or PNG");
  if (size > MAX_BYTES) throw new HttpError(413, "File must be 25 MB or smaller");

  const key = `kyc/${req.user.id}/${purpose}/${crypto.randomUUID()}.${ext}`;
  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType, ContentLength: size,
  }), { expiresIn: 300 });

  await Upload.create({ user: req.user.id, key, contentType, size, purpose, status: "pending" });
  res.json({ url, key });
});
```

The key is server-chosen, under the user's own prefix, with a random name. The client cannot pick a path, so it cannot overwrite someone else's file or guess another user's.

## Uploading from the browser

```ts
const { url, key } = await api.post("/uploads/sign", { contentType: file.type, size: file.size, purpose: "bank_statement" });
const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
if (!put.ok) throw new Error("Upload failed");
await api.post("/uploads/complete", { key });
```

The `Content-Type` header must match what was signed, or storage rejects the request. For progress bars, use `XMLHttpRequest` with `upload.onprogress`; `fetch` cannot report upload progress yet.

## Confirming on the server

Never trust "done". Check the object:

```js
router.post("/uploads/complete", requireAuth, async (req, res) => {
  const upload = await Upload.findOne({ key: req.body.key, user: req.user.id, status: "pending" });
  if (!upload) throw new HttpError(404, "Upload not found");
  const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: upload.key }));
  if (head.ContentLength !== upload.size || head.ContentType !== upload.contentType) throw new HttpError(400, "Upload does not match");
  upload.status = "ready";
  await upload.save();
  res.json({ ok: true });
});
```

A nightly job deletes `pending` uploads older than a day and their objects, so abandoned uploads do not accumulate.

## CORS on the bucket

The bucket must allow `PUT` from your origin with the `Content-Type` header, or every browser upload fails with a CORS error that has nothing to do with your API:

```json
[{ "AllowedOrigins": ["https://portal.growthavenues.in"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]
```

## Serving private files

KYC documents are private. Reading them is the same trick in reverse: a presigned `GET` URL, valid for a minute, issued only after the API checks the caller may see that file. Nothing in the bucket is public.

## Sources

- AWS SDK for JavaScript v3, presigned URLs: [docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- `@aws-sdk/s3-request-presigner`: [npmjs.com/package/@aws-sdk/s3-request-presigner](https://www.npmjs.com/package/@aws-sdk/s3-request-presigner)
- Cloudflare R2 presigned URLs: [developers.cloudflare.com/r2/api/s3/presigned-urls](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- S3 CORS configuration: [docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
