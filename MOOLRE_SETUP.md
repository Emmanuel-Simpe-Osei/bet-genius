# Moolre Integration — Setup Notes

## 1. Environment variables

Add these to your `.env` (get the actual values from your Moolre dashboard):

```
MOOLRE_ENV=sandbox            # switch to "live" when ready for production
MOOLRE_API_USER=your-username
MOOLRE_API_KEY=your-private-key
MOOLRE_API_PUBKEY=your-public-key
MOOLRE_ACCOUNT_NUMBER=your-moolre-account-number
MOOLRE_WEBHOOK_SECRET=the-secret-shown-when-you-created-your-wallet
```

`MOOLRE_WEBHOOK_SECRET` is the same `secret` value Moolre returns when you
create your account/Payment ID (e.g. `"secret": "cf2a797f-..."` in their
Create Account response). It's what every incoming webhook is checked
against — treat it like a password, never expose it client-side.

## 2. Database changes

The old code used a `paystack_ref` column. Rename it to something
provider-neutral so this isn't a problem again next time:

```sql
ALTER TABLE purchases RENAME COLUMN paystack_ref TO payment_ref;
ALTER TABLE purchases ADD COLUMN payment_provider TEXT DEFAULT 'moolre';
ALTER TABLE purchases ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE purchases ADD COLUMN moolre_transaction_id TEXT;
ALTER TABLE purchases ADD COLUMN amount_received NUMERIC;
```

Also make sure `payment_ref` has a **unique constraint** — that's what
actually stops a replayed webhook or a duplicate status-check call from
creating two "successful" rows for one payment:

```sql
ALTER TABLE purchases ADD CONSTRAINT purchases_payment_ref_unique UNIQUE (payment_ref);
```

## 3. Register your callback URL with Moolre

Per their docs: *"You provide your callback url when creating your wallet,
activating API or generating a payment link."* Set this in your Moolre
dashboard to:

```
https://yourdomain.com/api/moolre/webhook
```

## 4. How the flow works

1. Frontend calls `POST /api/moolre/initiate` with `user_id`, `game_id`,
   `phone`, `channel`. This looks up the real price server-side, writes a
   `pending` row keyed by a server-generated `externalref`, then sends the
   USSD prompt via Moolre.
2. Customer approves the prompt on their phone.
3. Moolre calls your webhook (`/api/moolre/webhook`) with the result. This
   is the source of truth — it verifies `data.secret`, checks
   `txstatus === 1`, and marks the row `success`.
4. As a fallback (in case a webhook delivery is ever missed), the frontend
   can poll `POST /api/moolre/status` with the `externalref` to ask Moolre
   directly.

## 5. What this fixes vs. the old Paystack code

- Webhook signature is actually verified (old code only checked the header
  existed, never validated it)
- Every write path checks for an existing `payment_ref` before writing —
  no more double-processing on retries or on user-driven duplicate calls
- Amount charged comes from a server-side price lookup and the amount
  *received* comes from Moolre's own webhook/status data — never from
  client input
- One code path per concern, instead of two near-duplicate "verify" routes
