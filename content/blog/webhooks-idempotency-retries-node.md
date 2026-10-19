---
title: "Receiving webhooks correctly: verify, respond fast, process once"
description: "Payment, email and biometric vendors all deliver events by webhook, and they all retry. A handler that does the work inline and trusts the payload will double-charge, double-email, or get spoofed. The receive-store-ack-process pattern I use, with the idempotency key that makes retries harmless."
date: 2028-01-10T03:30:00Z
tags: [webhooks, nodejs, express, reliability, payments]
keywords: [webhook idempotency node, verify webhook signature express, webhook retry duplicate events, process webhooks reliably, webhook queue node.js]
project: growth-avenues
---

The payment gateway sent the same `payment.captured` event four times in one minute because the handler took six seconds and the gateway's timeout was five. The handler credited the account four times. The fix was not "make it faster". The fix was to change what a webhook handler does.

## The pattern

1. **Verify** the signature. Reject anything that fails, before reading the body as JSON.
2. **Store** the raw event with its id, and return `200` immediately.
3. **Process** it from the stored copy, in a worker, exactly once.

The handler itself does almost nothing, so it never times out, and the gateway stops retrying.

## 1. Verify with the raw body

Signatures are computed over the exact bytes sent. If Express parses the JSON first and you re-stringify it, the signature will not match. Capture the raw body for the webhook route only:

```js
app.post("/webhooks/payments",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    const sig = req.get("X-Signature");
    const expected = crypto.createHmac("sha256", process.env.PAYMENTS_WEBHOOK_SECRET).update(req.body).digest("hex");
    if (!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return res.status(401).end();
    }
    req.event = JSON.parse(req.body);
    next();
  },
  receive
);
```

`timingSafeEqual` instead of `===` so that comparison time does not leak how many characters matched. Each provider documents its header name and algorithm; the shape is always this.

## 2. Store and acknowledge

```js
async function receive(req, res) {
  const ev = req.event;
  try {
    await WebhookEvent.create({ _id: ev.id, provider: "payments", type: ev.type, payload: ev, status: "pending" });
  } catch (err) {
    if (err.code === 11000) return res.status(200).end();   // seen before: ack and move on
    throw err;
  }
  res.status(200).end();
  queue.add("webhook", { id: ev.id });                        // or: the worker polls for pending
}
```

The provider's event id is the document `_id`. A retry hits the unique index, is recognised as a duplicate, and is acknowledged without doing anything. This is the whole of idempotency: one row per event, keyed by the provider's id.

The `200` goes out before any business logic. The gateway sees a fast success and never retries.

## 3. Process once, from the stored event

```js
async function processWebhook(id) {
  const ev = await WebhookEvent.findOneAndUpdate(
    { _id: id, status: "pending" }, { status: "processing", startedAt: new Date() }, { new: true }
  );
  if (!ev) return;                                            // another worker took it, or it is done
  try {
    await handlers[ev.type]?.(ev.payload);
    await WebhookEvent.updateOne({ _id: id }, { status: "done", doneAt: new Date() });
  } catch (err) {
    await WebhookEvent.updateOne({ _id: id }, { status: "failed", error: String(err), attempts: { $inc: 1 } });
    throw err;                                                // let the queue retry with backoff
  }
}
```

The atomic `findOneAndUpdate` from `pending` to `processing` means two workers cannot process the same event. A failure marks it for retry with the error recorded, and the admin can see a list of failed events with a "retry" button rather than a silent gap.

## The handler is idempotent too

Even with one row per event, the business operation should tolerate running twice, because a crash between "credited the account" and "marked done" will retry it:

```js
handlers["payment.captured"] = async (p) => {
  await Order.updateOne({ _id: p.orderId, status: "pending_payment" }, { status: "paid", paymentId: p.id, paidAt: p.capturedAt });
  // no-op if already paid: the filter on status makes it safe
};
```

Update with a filter on the prior state. A second run matches zero documents and does nothing.

## Out-of-order delivery

Providers do not promise order. A `payment.captured` can arrive before `payment.authorized`. Handlers key off the final state in the payload rather than assuming a sequence, and for anything where order matters, the handler fetches the current state from the provider's API before acting.

## The local test

A small script that POSTs a stored payload with a freshly computed signature to the local server, twice in a row, is the test. The first should process; the second should be acknowledged and ignored. It takes five minutes to write and catches every regression of this pattern since.

## Sources

- Stripe's webhook best practices, applicable to any provider: [docs.stripe.com/webhooks#best-practices](https://docs.stripe.com/webhooks#best-practices)
- Razorpay webhook signature verification: [razorpay.com/docs/webhooks/validate-test](https://razorpay.com/docs/webhooks/validate-test/)
- Node `crypto.timingSafeEqual`: [nodejs.org/api/crypto.html#cryptotimingsafeequala-b](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
- Express `express.raw`: [expressjs.com/en/api.html#express.raw](https://expressjs.com/en/api.html#express.raw)
- Idempotency keys, explained: [stripe.com/blog/idempotency](https://stripe.com/blog/idempotency)
