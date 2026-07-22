// lib/moolre.js
//
// Thin wrapper around Moolre's Initiate Payment and Payment Status endpoints.
// Keep all Moolre-specific request shaping here so route handlers stay simple.

const MOOLRE_BASE_URL =
  process.env.MOOLRE_ENV === "live"
    ? "https://api.moolre.com"
    : "https://sandbox.moolre.com";

const REQUIRED_ENV = [
  "MOOLRE_API_USER",
  "MOOLRE_API_KEY",
  "MOOLRE_API_PUBKEY",
  "MOOLRE_ACCOUNT_NUMBER",
];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Moolre env vars: ${missing.join(", ")}`);
  }
}

/**
 * Sends a USSD payment prompt to the customer's mobile money number.
 *
 * IMPORTANT: a successful response here (code "TR099") only means the
 * prompt was delivered — it is NOT a confirmed payment. The customer still
 * has to approve it on their phone. Real confirmation comes from the
 * webhook, or from checkMoolrePaymentStatus() below.
 */
export async function initiateMoolrePayment({
  channel,
  currency,
  payer,
  amount,
  externalref,
  reference,
  otpcode,
  sessionid,
}) {
  assertEnv();

  const res = await fetch(`${MOOLRE_BASE_URL}/open/transact/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-USER": process.env.MOOLRE_API_USER,
      "X-API-KEY": process.env.MOOLRE_API_KEY,
    },
    body: JSON.stringify({
      type: 1,
      channel,
      currency,
      payer,
      amount: String(amount),
      externalref,
      reference: reference || "",
      otpcode: otpcode || "",
      sessionid: sessionid || "",
      accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
    }),
  });

  const data = await res.json();
  return { httpOk: res.ok, ...data };
}

/**
 * Checks the final status of a payment by externalref.
 * data.txstatus: 1 = Successful, 0 = Pending, 2 = Failed.
 *
 * Per Moolre's own docs: never treat a transaction as failed unless
 * txstatus is explicitly 2. Anything else (including unexpected values)
 * should be treated as still pending.
 */
export async function checkMoolrePaymentStatus(externalref) {
  assertEnv();

  const res = await fetch(`${MOOLRE_BASE_URL}/open/transact/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-USER": process.env.MOOLRE_API_USER,
      "X-API-PUBKEY": process.env.MOOLRE_API_PUBKEY,
    },
    body: JSON.stringify({
      type: 1,
      idtype: "1", // 1 = externalref, 2 = Moolre-generated ID
      id: externalref,
      accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
    }),
  });

  const data = await res.json();
  return { httpOk: res.ok, ...data };
}
