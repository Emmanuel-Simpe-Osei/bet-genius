"use client";

import { useState } from "react";

// ============================================================================
// EDIT ME: MTN MoMo USSD sequence
// ----------------------------------------------------------------------------
// Each entry is one step of the USSD menu, in order. They are joined with "*"
// and "#" is added at the end, e.g. ["*170", "2", "1", ...] -> "*170*2*1*...#".
//
// Placeholders, filled in at build time:
//   {merchantNumber}  {amount}  {reference}
//
// {merchantNumber} is the number receiving the money (here a personal MoMo
// number, so this uses the "Transfer Money > MoMo User" flow).
//
// THIS SEQUENCE IS A GUESS. Dial *170# by hand, note the menu numbers you
// press, and update the steps below.
// ============================================================================
export const MOMO_USSD_STEPS = [
  "*170",
  "1", // e.g. "Transfer Money" (confirm on a real phone)
  "1", // e.g. "MoMo User" (confirm on a real phone)
  "{merchantNumber}",
  "{merchantNumber}", // MTN asks you to confirm the number
  "{amount}",
  "{reference}",
];

// iPhones refuse to dial tel: links containing * or #, so USSD links can't work there.
export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Default for encoding "*" as %2A in the tel: link. Some Android dialers need
// it, others show "%2A" literally. The checkbox on the page can also flip it.
export const ENCODE_STAR_DEFAULT = false;

/**
 * Builds the raw USSD string and the tel: link.
 * "#" is always encoded as %23 (otherwise the browser treats it as a URL
 * fragment and cuts everything after it). "*" is encoded only if encodeStar.
 */
export function buildMomoUssdLink({
  merchantNumber,
  amount,
  reference,
  encodeStar = ENCODE_STAR_DEFAULT,
}) {
  const values = {
    merchantNumber: String(merchantNumber ?? "").trim(),
    amount: String(amount ?? "").trim(),
    reference: String(reference ?? "").trim(),
  };

  const raw =
    MOMO_USSD_STEPS.map((step) =>
      step.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "")
    ).join("*") + "#";

  let encoded = raw.replace(/#/g, "%23");
  if (encodeStar) encoded = encoded.replace(/\*/g, "%2A");

  return { raw, link: `tel:${encoded}` };
}

export default function MomoUssdButton() {
  const [merchantNumber, setMerchantNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [encodeStar, setEncodeStar] = useState(ENCODE_STAR_DEFAULT);

  const { raw, link } = buildMomoUssdLink({
    merchantNumber,
    amount,
    reference,
    encodeStar,
  });

  // "*", "#" or spaces inside a field would break the USSD sequence.
  const badChars = /[*#\s]/.test(merchantNumber + amount + reference);

  const handlePay = () => {
    window.location.href = link;
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900";

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 text-gray-900">
      <h1 className="text-xl font-bold">Pay with Mobile Money</h1>

      <label className="block">
        <span className="text-sm font-medium">Merchant number</span>
        <input
          className={inputClass}
          inputMode="numeric"
          value={merchantNumber}
          onChange={(e) => setMerchantNumber(e.target.value)}
          placeholder="e.g. 123456"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Amount</span>
        <input
          className={inputClass}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Reference</span>
        <input
          className={inputClass}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. TEST01"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={encodeStar}
          onChange={(e) => setEncodeStar(e.target.checked)}
        />
        Encode * as %2A
      </label>

      {badChars && (
        <p className="text-sm text-red-600">
          Fields contain *, # or spaces. These will break the USSD string.
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        className="w-full rounded-lg bg-yellow-400 py-3 text-lg font-bold text-black active:bg-yellow-500"
      >
        Pay with MoMo
      </button>

      <div className="space-y-2 rounded-lg bg-gray-100 p-3 text-sm">
        <div>
          <div className="font-medium">Raw USSD string ({raw.length} chars)</div>
          <code className="block break-all">{raw}</code>
        </div>
        <div>
          <div className="font-medium">tel: link</div>
          <code className="block break-all">{link}</code>
        </div>
      </div>
    </div>
  );
}
