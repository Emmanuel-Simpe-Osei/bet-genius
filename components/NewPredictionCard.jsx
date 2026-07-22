// components/NewPredictionCard.jsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#FFD601";
const NAVY = "#142B6F";

// Converts a locally-entered number (e.g. 0244123456) into the
// 233XXXXXXXXX format Moolre expects.
function normalizePhone(input) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return "233" + digits.slice(1);
  return "233" + digits;
}

export default function NewPredictionCard({ game, isLoggedIn }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // ---- Moolre purchase flow state ----
  const [showPurchase, setShowPurchase] = useState(false);
  const [phase, setPhase] = useState("phone"); // phone | otp | waiting | success | error
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("13"); // 13=MTN, 6=Telecel, 7=AT
  const [otpcode, setOtpcode] = useState("");
  const [externalref, setExternalref] = useState(null);
  const [purchaseError, setPurchaseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef(null);

  const {
    id,
    title,
    totalOdds,
    price,
    matchData,
    bookingCode,
    gameDate,
    rawType,
  } = game;

  const isFree = !price || Number(price) === 0;
  const isCustom = (rawType || "").toLowerCase().includes("custom");

  function resetPurchaseState() {
    setPhase("phone");
    setPhone("");
    setOtpcode("");
    setExternalref(null);
    setPurchaseError("");
    setSubmitting(false);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  function closePurchaseModal() {
    setShowPurchase(false);
    resetPurchaseState();
  }

  // Polls /api/moolre/status until the payment resolves, as a fallback
  // in case the webhook is delayed. Stops after ~60s either way.
  function startPolling(ref) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/moolre/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ externalref: ref }),
        });
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(pollRef.current);
          setPhase("success");
          toast.success("Payment successful!");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current);
          setPhase("error");
          setPurchaseError("Payment failed or was declined.");
        } else if (attempts >= 20) {
          // ~60s at 3s intervals
          clearInterval(pollRef.current);
          setPhase("error");
          setPurchaseError(
            "Still waiting for confirmation. Check your Purchases page shortly — it may complete a little after this."
          );
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }
    }, 3000);
  }

  // ------------------------------------------------------------
  // HANDLE UNLOCK (PAID) — opens the purchase modal
  // ------------------------------------------------------------
  const handleUnlock = () => {
    if (!isLoggedIn) {
      router.push("/login?next=/predictions");
      return;
    }

    if (isCustom) {
      setShowModal(true);
      return;
    }

    resetPurchaseState();
    setShowPurchase(true);
  };

  // ------------------------------------------------------------
  // SUBMIT PHONE — starts the Moolre payment prompt
  // ------------------------------------------------------------
  async function submitPhone(e) {
    e.preventDefault();
    if (!phone.trim()) {
      setPurchaseError("Enter a mobile money number.");
      return;
    }

    setSubmitting(true);
    setPurchaseError("");

    try {
      const res = await fetch("/api/moolre/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: id,
          phone: normalizePhone(phone),
          channel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPurchaseError(data.error || "Failed to start payment.");
        return;
      }

      if (data.status === "otp_required") {
        setExternalref(data.externalref);
        setPhase("otp");
        toast.success("A verification code was sent via SMS.");
        return;
      }

      if (data.status === "prompt_sent") {
        setExternalref(data.externalref);
        setPhase("waiting");
        startPolling(data.externalref);
        return;
      }

      setPurchaseError("Unexpected response — please try again.");
    } catch (err) {
      console.error("Moolre initiate error:", err);
      setPurchaseError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------
  // SUBMIT OTP — completes the two-step Moolre verification
  // ------------------------------------------------------------
  async function submitOtp(e) {
    e.preventDefault();
    if (!otpcode.trim()) {
      setPurchaseError("Enter the code sent to your phone.");
      return;
    }

    setSubmitting(true);
    setPurchaseError("");

    try {
      const res = await fetch("/api/moolre/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalref,
          otpcode: otpcode.trim(),
          phone: normalizePhone(phone),
          channel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPurchaseError(data.error || "Verification failed.");
        return;
      }

      if (data.status === "prompt_sent") {
        setPhase("waiting");
        startPolling(externalref);
        return;
      }

      setPurchaseError("Unexpected response — please try again.");
    } catch (err) {
      console.error("Moolre OTP submit error:", err);
      setPurchaseError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------
  // HANDLE FREE COPY WITH CELEBRATION
  // ------------------------------------------------------------
  const handleFreeClick = () => {
    if (bookingCode) {
      navigator.clipboard
        ?.writeText(bookingCode)
        .then(() => {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        })
        .catch(() => {});
    }
  };

  const formattedDate = gameDate
    ? new Date(gameDate).toLocaleDateString()
    : "N/A";

  return (
    <>
      {/* SLOT FULL MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-[#142B6F] to-[#1E3A8A] rounded-3xl max-w-md w-full p-8 text-center border-2 border-[#FFD601] shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-3">Slot Full</h3>
              <p className="text-[#AFC3FF] text-lg mb-8 leading-relaxed">
                Please wait for the next game drop
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 rounded-2xl font-bold text-lg text-[#142B6F] bg-gradient-to-r from-[#FFD601] to-[#FFE769]"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CELEBRATION MODAL FOR FREE TIPS */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-[#FFD601] to-[#FFE769] rounded-3xl max-w-md w-full p-8 text-center border-4 border-white shadow-2xl"
            >
              <h3 className="text-3xl font-bold text-[#142B6F] mb-4">Hurray!</h3>
              <p className="text-[#142B6F] text-xl mb-2 font-semibold">
                Booking Code Copied!
              </p>
              <div className="bg-white rounded-2xl p-4 mb-6 border-2 border-[#142B6F]">
                <p className="text-xs text-[#AFC3FF] uppercase mb-1">
                  Booking Code
                </p>
                <p className="text-2xl font-bold text-[#142B6F] font-mono tracking-wider">
                  {bookingCode}
                </p>
              </div>
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-[#142B6F] to-[#1E3A8A]"
              >
                Let's Play! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOOLRE PURCHASE MODAL */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-[#142B6F] to-[#1E3A8A] rounded-3xl max-w-md w-full p-8 border-2 border-[#FFD601] shadow-2xl"
            >
              {phase === "phone" && (
                <form onSubmit={submitPhone}>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Pay ₵{Number(price).toLocaleString()} via Mobile Money
                  </h3>
                  <p className="text-[#AFC3FF] text-sm mb-5">
                    Enter your Mobile Money number to receive a payment prompt.
                  </p>

                  <label className="block text-xs text-[#AFC3FF] mb-1">
                    Network
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full mb-4 p-3 rounded-xl bg-[#0F1E4D] text-white border border-[#2D4BA8]"
                  >
                    <option value="13">MTN</option>
                    <option value="6">Telecel</option>
                    <option value="7">AirtelTigo</option>
                  </select>

                  <label className="block text-xs text-[#AFC3FF] mb-1">
                    Mobile Money Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0244123456"
                    className="w-full mb-4 p-3 rounded-xl bg-[#0F1E4D] text-white border border-[#2D4BA8]"
                  />

                  {purchaseError && (
                    <p className="text-red-400 text-sm mb-3">{purchaseError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl font-bold text-[#142B6F] bg-gradient-to-r from-[#FFD601] to-[#FFE769] mb-2"
                  >
                    {submitting ? "Sending..." : "Send Payment Prompt"}
                  </button>
                  <button
                    type="button"
                    onClick={closePurchaseModal}
                    className="w-full py-2 text-[#AFC3FF] text-sm"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {phase === "otp" && (
                <form onSubmit={submitOtp}>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Verify Your Number
                  </h3>
                  <p className="text-[#AFC3FF] text-sm mb-5">
                    Enter the code sent via SMS to {phone}.
                  </p>

                  <input
                    type="text"
                    value={otpcode}
                    onChange={(e) => setOtpcode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full mb-4 p-3 rounded-xl bg-[#0F1E4D] text-white border border-[#2D4BA8]"
                  />

                  {purchaseError && (
                    <p className="text-red-400 text-sm mb-3">{purchaseError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl font-bold text-[#142B6F] bg-gradient-to-r from-[#FFD601] to-[#FFE769] mb-2"
                  >
                    {submitting ? "Verifying..." : "Verify & Pay"}
                  </button>
                  <button
                    type="button"
                    onClick={closePurchaseModal}
                    className="w-full py-2 text-[#AFC3FF] text-sm"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {phase === "waiting" && (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-3">
                    Check Your Phone
                  </h3>
                  <p className="text-[#AFC3FF] text-sm mb-6">
                    Approve the payment prompt on your phone to unlock this
                    game. This page will update automatically.
                  </p>
                  <div className="w-10 h-10 mx-auto border-4 border-[#FFD601] border-t-transparent rounded-full animate-spin mb-6" />
                  <button
                    onClick={closePurchaseModal}
                    className="w-full py-2 text-[#AFC3FF] text-sm"
                  >
                    Close (payment will still be processed)
                  </button>
                </div>
              )}

              {phase === "success" && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Payment Successful! 🎉
                  </h3>
                  <p className="text-[#AFC3FF] text-sm mb-6">
                    Your booking code is ready in your purchases.
                  </p>
                  <button
                    onClick={() => {
                      closePurchaseModal();
                      router.push("/user-dashboard/purchases");
                    }}
                    className="w-full py-3 rounded-2xl font-bold text-[#142B6F] bg-gradient-to-r from-[#FFD601] to-[#FFE769]"
                  >
                    View My Purchases
                  </button>
                </div>
              )}

              {phase === "error" && (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {purchaseError.includes("Still waiting")
                      ? "Almost There"
                      : "Payment Issue"}
                  </h3>
                  <p className="text-[#AFC3FF] text-sm mb-6">{purchaseError}</p>
                  <button
                    onClick={closePurchaseModal}
                    className="w-full py-3 rounded-2xl font-bold text-[#142B6F] bg-gradient-to-r from-[#FFD601] to-[#FFE769]"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREDICTION CARD */}
      <div className="rounded-3xl shadow-lg overflow-hidden bg-gradient-to-br from-[#142B6F] to-[#1E3A8A] text-white border border-[#2D4BA8] hover:border-[#FFD601]/30 transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-between items-center px-6 pt-5 pb-1">
          <div className="flex flex-col gap-1">
            <span className="uppercase text-sm tracking-wide font-bold text-white">
              {title || "Free"}
            </span>
            <span className="text-xs text-[#AFC3FF]">
              Game Date:{" "}
              <span className="font-semibold text-white">{formattedDate}</span>
            </span>
          </div>

          <div className="text-right">
            <span className="uppercase text-xs text-[#AFC3FF] block">
              Price
            </span>
            {isFree ? (
              <div
                className="font-bold text-sm cursor-pointer"
                style={{ color: GOLD }}
                onClick={handleFreeClick}
              >
                {bookingCode || "FREE"}
              </div>
            ) : (
              <span className="font-bold text-sm" style={{ color: GOLD }}>
                ₵{Number(price).toLocaleString()}
              </span>
            )}
            {totalOdds && (
              <span className="block text-[10px] text-[#AFC3FF] mt-1">
                Total Odds:{" "}
                <span className="font-semibold text-white">
                  {Number(totalOdds).toLocaleString()}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 bg-[#0F1E4D]/80 rounded-xl mx-6 p-4 max-h-60 overflow-y-auto border border-[#1b2e6a]">
          {(matchData || []).map((m, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b border-[#1b2e6a] py-3 last:border-b-0 hover:bg-[#1b2e6a]/50 px-2 rounded-lg transition-colors"
            >
              <div className="text-xs flex-1">
                <div className="font-medium text-white">
                  {m.homeTeam} vs {m.awayTeam}
                </div>
                <div className="text-[10px] text-[#AFC3FF] mt-1">
                  {m.marketDesc || ""}
                </div>
              </div>
              <div className="text-[10px] font-semibold text-[#FFD601] bg-[#1b2e6a] px-2 py-1 rounded">
                {m.status || ""}
              </div>
            </div>
          ))}

          {(!matchData || matchData.length === 0) && (
            <p className="text-xs text-[#AFC3FF] text-center py-4">
              No match data available.
            </p>
          )}
        </div>

        <div className="px-6 pt-4 pb-6">
          <p className="text-xs text-[#AFC3FF] mb-3">
            {isFree ? (
              <>Click the golden code above to copy</>
            ) : (
              "Locked — purchase to reveal"
            )}
          </p>

          <button
            onClick={isFree ? handleFreeClick : handleUnlock}
            className="w-full py-3 rounded-2xl font-bold text-sm"
            style={{
              backgroundColor: isFree ? "#1E3A8A" : GOLD,
              color: isFree ? GOLD : NAVY,
              border: isFree ? `2px solid ${GOLD}` : "none",
            }}
          >
            {isFree
              ? "🎁 Get Free Tip"
              : `Unlock for ₵${Number(price).toLocaleString()}`}
          </button>
        </div>
      </div>
    </>
  );
}
