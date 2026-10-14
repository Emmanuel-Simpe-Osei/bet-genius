// lib/osemPay.js
// -------------------------------------------------------------
// SERVER-ONLY helpers for OSEM Pay (https://storefront.osemtech.com).
// Uses OSEM_SECRET_KEY, so never import this from a client component.
//
// Flow:
//   1. createPayment()   -> customer is sent to payment_url
//   2. webhook / status  -> getPaymentStatus() confirms "settled"
//   3. fulfilOrder()     -> order marked paid + access granted (once)
// -------------------------------------------------------------

import crypto from "node:crypto";
import supabaseAdmin from "@/lib/supabaseAdmin";

const OSEM_BASE_URL = process.env.OSEM_BASE_URL || "https://storefront.osemtech.com";

function secretKey() {
  const key = process.env.OSEM_SECRET_KEY;
  if (!key) throw new Error("OSEM_SECRET_KEY is not set");
  return key;
}

// Ghana local format, e.g. 0241234567. Accepts +233 / 233 and strips spaces.
export function normalizeGhanaPhone(input) {
  let p = String(input || "").replace(/[\s-]/g, "");
  if (p.startsWith("+233")) p = "0" + p.slice(4);
  else if (p.startsWith("233") && p.length === 12) p = "0" + p.slice(3);
  return /^0[235]\d{8}$/.test(p) ? p : null;
}

export async function createPayment({ amount, phone, reference, name, email, callbackUrl }) {
  const body = {
    amount: Number(amount),
    customer_phone: phone,
    reference,
  };
  if (name) body.customer_name = name;
  if (email) body.customer_email = email;
  // OSEM only accepts https callback URLs (so none on plain-http localhost).
  if (callbackUrl?.startsWith("https://")) body.callback_url = callbackUrl;

  const res = await fetch(`${OSEM_BASE_URL}/api/pay`, {
    method: "POST",
    headers: { "x-api-key": secretKey(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.success === true, status: res.status, data };
}

export async function getPaymentStatus(reference) {
  const res = await fetch(
    `${OSEM_BASE_URL}/api/pay/status?reference=${encodeURIComponent(reference)}`,
    { headers: { "x-api-key": secretKey() }, cache: "no-store" }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Header looks like: t=1760452330,v1=5f2b...
// v1 = HMAC-SHA256(signing secret, `${t}.${rawBody}`), rejected if > 5 min old.
export function verifyWebhookSignature(rawBody, header) {
  const secret = process.env.OSEM_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > 300) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  if (parts.v1.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(parts.v1, "hex"), Buffer.from(expected, "hex"));
}

// Marks a pending OSEM order as paid and grants access to the game.
// Safe to call more than once (webhook + status poll can both fire):
// the status guard on the update means only the first call wins.
export async function fulfilOrder(orderId, payment) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, game_id, amount, status")
    .eq("id", orderId)
    .single();

  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.status === "paid") return { ok: true, alreadyPaid: true };
  if (order.status !== "pending") return { ok: false, reason: `order_${order.status}` };

  if (Number(payment?.gross_amount) + 0.001 < Number(order.amount)) {
    console.error("OSEM amount mismatch", { orderId, expected: order.amount, got: payment?.gross_amount });
    return { ok: false, reason: "amount_mismatch" };
  }

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("booking_code, match_data")
    .eq("id", order.game_id)
    .single();

  const { data: updated, error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      booking_code: game?.booking_code,
      match_data: game?.match_data,
      paystack_ref: payment?.transaction_id || null,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!updated) return { ok: true, alreadyPaid: true };

  const { data: existing } = await supabaseAdmin
    .from("user_game_access")
    .select("id")
    .eq("order_id", updated.id)
    .maybeSingle();

  if (!existing) {
    await supabaseAdmin.from("user_game_access").insert({
      user_id: updated.user_id,
      game_id: updated.game_id,
      order_id: updated.id,
      booking_code: updated.booking_code,
      access_type: "purchase",
    });
  }

  return { ok: true };
}

export async function markOrderFailed(orderId) {
  await supabaseAdmin
    .from("orders")
    .update({ status: "failed" })
    .eq("id", orderId)
    .eq("status", "pending");
}
