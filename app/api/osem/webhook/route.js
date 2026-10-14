// app/api/osem/webhook/route.js
//
// OSEM Pay webhook. Set this URL in OSEM Dashboard -> Payments ->
// API keys & webhooks:  https://<your-domain>/api/osem/webhook
//
// Verifies the X-Storefront-Signature header against the raw body, then
// re-checks the payment with the status endpoint before fulfilling.
// OSEM does not retry, so /payment-complete also confirms via status.

import { NextResponse } from "next/server";
import { fulfilOrder, getPaymentStatus, verifyWebhookSignature } from "@/lib/osemPay";

export async function POST(req) {
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, req.headers.get("x-storefront-signature"))) {
    return new NextResponse("bad signature", { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new NextResponse("bad body", { status: 400 });
  }

  if (event.test === true) {
    return NextResponse.json({ received: true, test: true });
  }

  if (event.event === "payment.confirmed" && event.reference) {
    try {
      const { ok, data } = await getPaymentStatus(event.reference);
      if (ok && data.status === "settled") {
        await fulfilOrder(event.reference, data);
      }
    } catch (err) {
      // Still reply 2xx; the customer's status check will pick it up.
      console.error("OSEM webhook fulfil error:", err);
    }
  }

  return NextResponse.json({ received: true });
}
