"use client";

// app/payment-complete/page.jsx
//
// Landing page after an OSEM Pay checkout (and the waiting page when the
// customer approves on their phone instead). Polls /api/osem/status with
// our own order id until the payment is settled, then sends the customer
// to their purchases where the booking code is revealed.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function PaymentComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") || "";
  const viaPhone = searchParams.get("prompt") === "1";

  const [phase, setPhase] = useState("confirming"); // confirming | failed | timeout | error

  useEffect(() => {
    if (!orderId) {
      setPhase("error");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 45; // 45 * 3s ≈ 2 min, enough to approve a phone prompt

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;

      try {
        const res = await fetch(`/api/osem/status?order=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data?.status === "paid") {
          router.replace("/user-dashboard/purchases");
          return;
        }
        if (res.ok && data?.status === "failed") {
          setPhase("failed");
          return;
        }
      } catch (err) {
        // Network hiccup — keep trying until MAX_ATTEMPTS
      }

      if (attempts >= MAX_ATTEMPTS) {
        setPhase("timeout");
        return;
      }

      setTimeout(tick, 3000);
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const dashboardButton = (
    <button
      onClick={() => router.push("/user-dashboard/purchases")}
      className="w-full min-h-[48px] rounded-full font-semibold text-bg bg-accent hover:brightness-110"
    >
      Go to my dashboard
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full text-center"
    >
      {phase === "confirming" && (
        <>
          <div className="w-12 h-12 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin mb-6" />
          <h1 className="text-xl font-bold mb-3">
            {viaPhone ? "Approve the payment on your phone" : "Confirming your payment"}
          </h1>
          <p className="text-ink/60 text-sm leading-relaxed">
            {viaPhone
              ? "Check your phone for the Mobile Money prompt and enter your PIN. This page updates automatically."
              : "This usually takes a few seconds. Please don't close this page."}
          </p>
        </>
      )}

      {phase === "failed" && (
        <>
          <h1 className="text-xl font-bold mb-3">Payment not completed</h1>
          <p className="text-ink/60 text-sm mb-8 leading-relaxed">
            The payment was declined, cancelled or expired. You were not charged. You can try
            again from the predictions page.
          </p>
          <button
            onClick={() => router.push("/predictions")}
            className="w-full min-h-[48px] rounded-full font-semibold text-bg bg-accent hover:brightness-110"
          >
            Back to predictions
          </button>
        </>
      )}

      {phase === "timeout" && (
        <>
          <h1 className="text-xl font-bold mb-3">Still confirming</h1>
          <p className="text-ink/60 text-sm mb-8 leading-relaxed">
            Your payment is being verified. It will appear in your dashboard as soon as it's
            settled.
          </p>
          {dashboardButton}
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="text-xl font-bold mb-3">Something's off</h1>
          <p className="text-ink/60 text-sm mb-8 leading-relaxed">
            We couldn't find this payment. If you were charged, check your dashboard in a moment.
          </p>
          {dashboardButton}
        </>
      )}
    </motion.div>
  );
}

export default function PaymentCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <PaymentComplete />
      </Suspense>
    </div>
  );
}
