---
title: "Integrating a payment gateway in a Node app: the order-first pattern that survives refreshes, retries and refunds"
description: "Fee payments on a client portal, built on Razorpay but shaped the same for any gateway. Create an order on your side first, let the gateway own the payment, confirm by webhook not by redirect, and keep a ledger. The sequence, the schema, and the three failure cases that the simple tutorial version gets wrong."
date: 2028-01-17T03:30:00Z
tags: [payments, nodejs, razorpay, express, reliability]
keywords: [razorpay integration node.js, payment gateway integration pattern, verify payment signature server, payment webhook vs redirect, payment ledger design]
project: growth-avenues
---

Every gateway's quick-start shows the same thing: a button, a checkout popup, a success callback. Shipping that as-is leads to the three support tickets I have personally handled: "I paid but the portal says pending", "I was charged twice", and "where is my refund". The pattern below has not produced any of them in two years.

## The sequence

1. **Server creates an internal order** (`status: created`, amount, what it is for) and then a gateway order with the same amount. Stores the gateway's order id.
2. **Client opens checkout** with the gateway order id. The gateway collects the card or UPI details; your server never sees them.
3. **Gateway tells the client** "success" and redirects or calls back. Your client tells your server "I think I paid".
4. **Server verifies** the gateway's signature over the order id and payment id. If valid, marks the order `paid` *provisionally* and shows success.
5. **Gateway webhook** `payment.captured` arrives. Server confirms the order `paid` for real, from the webhook. This is the source of truth.
6. **Ledger entry** written: a credit of the amount against the account, referencing the payment id.

Steps 4 and 5 both exist because either can fail to arrive. The redirect fails when the person closes the tab; the webhook fails when your server is briefly down. Whichever arrives first marks the order; the other finds it already marked and does nothing.

## Schema

```js
const orderSchema = new Schema({
  account: { type: ObjectId, ref: "Account", index: true },
  purpose: String,                                  // "annual_fee", "advisory_q1"
  amount: Number,                                   // paise, integer, never float
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "paid", "failed", "refunded"], index: true },
  gateway: { provider: String, orderId: { type: String, unique: true }, paymentId: String, method: String },
  paidAt: Date,
}, { timestamps: true });

const ledgerSchema = new Schema({
  account: { type: ObjectId, index: true },
  kind: { type: String, enum: ["credit", "debit"] },
  amount: Number,
  reference: { type: String, unique: true },        // payment id or refund id: one entry per event
  note: String,
}, { timestamps: true });
```

Amounts in the smallest unit as integers. A float for money will be wrong by a paisa eventually, and the ledger's unique `reference` is what makes a duplicate webhook harmless.

## Creating the order

```js
router.post("/orders", requireAuth, validate(orderSchema), async (req, res) => {
  const { purpose } = req.validated.body;
  const amount = priceFor(purpose);                 // server decides the amount, never the client
  const order = await Order.create({ account: req.user.account, purpose, amount, status: "created", gateway: { provider: "razorpay" } });
  const gw = await razorpay.orders.create({ amount, currency: "INR", receipt: String(order._id), notes: { orderId: String(order._id) } });
  order.gateway.orderId = gw.id;
  await order.save();
  res.json({ orderId: order._id, gatewayOrderId: gw.id, amount, key: process.env.RAZORPAY_KEY_ID });
});
```

The client sends what it wants to pay for, not how much. The amount comes from the server's price table. This closes the "edit the amount in dev tools" hole that the tutorial version has.

## Verifying the client callback

```js
router.post("/orders/:id/confirm", requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))) throw new HttpError(400, "Invalid signature");
  await markPaid({ gatewayOrderId: razorpay_order_id, paymentId: razorpay_payment_id });
  res.json({ ok: true });
});
```

## One function marks paid, from either path

```js
async function markPaid({ gatewayOrderId, paymentId, method }) {
  const order = await Order.findOneAndUpdate(
    { "gateway.orderId": gatewayOrderId, status: "created" },
    { status: "paid", "gateway.paymentId": paymentId, "gateway.method": method, paidAt: new Date() },
    { new: true }
  );
  if (!order) return;                                // already paid, or unknown: nothing to do
  try {
    await Ledger.create({ account: order.account, kind: "credit", amount: order.amount, reference: paymentId, note: order.purpose });
  } catch (err) { if (err.code !== 11000) throw err; }
  await sendReceipt(order);
}
```

The webhook handler for `payment.captured` calls the same `markPaid`. Two calls, one effect.

## The three failures

**Paid but pending.** The person closed the tab before the callback. The webhook arrives a few seconds later and marks it paid. If the webhook is delayed, the order page polls `/orders/:id` every few seconds for a minute, and a nightly job reconciles any `created` orders older than an hour against the gateway's API.

**Charged twice.** Happens when a client-side retry creates a second gateway order. Prevented by returning the existing `created` order for the same account and purpose within the last fifteen minutes instead of creating another, and by the gateway order id's unique index.

**Refunds.** Issued from the admin, through the gateway's API, never by editing the database. The `refund.processed` webhook writes a `debit` ledger entry with the refund id as reference and sets the order to `refunded`. The account balance is always the sum of the ledger, so it is right by construction.

## Test mode is not optional

Every gateway has test keys and test cards. Staging uses them exclusively, and the webhook endpoint on staging is registered in the gateway's test dashboard. A payment flow that has only been tried in production will fail in production.

## Sources

- Razorpay orders and payment verification: [razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration](https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/)
- Razorpay webhooks: [razorpay.com/docs/webhooks](https://razorpay.com/docs/webhooks/)
- Why money should not be a float: [floating-point-gui.de/basic](https://floating-point-gui.de/basic/)
- Stripe's guide to the same pattern on their platform: [docs.stripe.com/payments/accept-a-payment](https://docs.stripe.com/payments/accept-a-payment)
- Martin Fowler on ledgers and accounting patterns: [martinfowler.com/apsupp/accounting.pdf](https://martinfowler.com/apsupp/accounting.pdf)
