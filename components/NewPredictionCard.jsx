// components/NewPredictionCard.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#FFD601";
const NAVY = "#142B6F";

export default function NewPredictionCard({ game, isLoggedIn, userId, userEmail }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

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

  const handleUnlock = async () => {
    if (!isLoggedIn) {
      router.push("/login?next=/predictions");
      return;
    }

    if (isCustom) {
      setShowModal(true);
      return;
    }

    if (!userEmail || !userId) {
      toast.error("Could not find your account details. Please re-login.");
      return;
    }

    setPayLoading(true);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          amount: price,
          metadata: {
            userId,
            gameId: id,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not start payment.");
        setPayLoading(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("Paystack initialize error:", err);
      toast.error("Something went wrong. Please try again.");
      setPayLoading(false);
    }
  };

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
              <h3 className="text-3xl font-bold text-[#142B6F] mb-4">
                Hurray!
              </h3>
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
            disabled={payLoading}
            className="w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-60"
            style={{
              backgroundColor: isFree ? "#1E3A8A" : GOLD,
              color: isFree ? GOLD : NAVY,
              border: isFree ? `2px solid ${GOLD}` : "none",
            }}
          >
            {isFree
              ? "🎁 Get Free Tip"
              : payLoading
              ? "Redirecting to payment..."
              : `Unlock for ₵${Number(price).toLocaleString()}`}
          </button>
        </div>
      </div>
    </>
  );
}
