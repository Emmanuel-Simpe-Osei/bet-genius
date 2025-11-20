// components/NewPredictionCard.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#FFD601";
const NAVY = "#142B6F";

export default function NewPredictionCard({ game, isLoggedIn }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    id,
    title,
    gameName,
    totalOdds,
    price,
    matchData,
    bookingCode,
    gameDate,
    rawType,
  } = game;

  const isFree = !price || Number(price) === 0;
  const isCustom = (rawType || "").toLowerCase().includes("custom");

  // ------------------------------------------------------------
  // HANDLE UNLOCK (PAID)
  // ------------------------------------------------------------
  const handleUnlock = async () => {
    if (!isLoggedIn) {
      router.push("/login?next=/predictions");
      return;
    }

    if (isCustom) {
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/purchase/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start payment");
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error("Payment init error:", err);
      toast.error("Unable to start payment.");
    } finally {
      setLoading(false);
    }
  };

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
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FFD601] to-[#FFE769] flex items-center justify-center shadow-lg"
              >
                <svg
                  className="w-10 h-10 text-[#142B6F]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-3"
              >
                Slot Full
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[#AFC3FF] text-lg mb-8 leading-relaxed"
              >
                Please wait for the next game drop
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowModal(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-2xl font-bold text-lg text-[#142B6F] bg-gradient-to-r from-[#FFD601] to-[#FFE769] hover:from-[#FFE769] hover:to-[#FFD601] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Got It
              </motion.button>
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
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-gradient-to-br from-[#FFD601] to-[#FFE769] rounded-3xl max-w-md w-full p-8 text-center border-4 border-white shadow-2xl relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 text-6xl">🎯</div>
                <div className="absolute top-10 right-6 text-4xl">⚽</div>
                <div className="absolute bottom-8 left-8 text-5xl">🏆</div>
                <div className="absolute bottom-12 right-4 text-3xl">⭐</div>
              </div>

              {/* Animated Confetti */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center shadow-lg border-4 border-white"
              >
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-[#142B6F] mb-4"
              >
                Hurray!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[#142B6F] text-xl mb-2 font-semibold"
              >
                Booking Code Copied!
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[#1E3A8A] text-lg mb-6"
              >
                Enjoy your free games!
              </motion.p>

              {/* Booking Code Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl p-4 mb-6 border-2 border-[#142B6F]"
              >
                <p className="text-xs text-[#AFC3FF] uppercase mb-1">
                  Booking Code
                </p>
                <p className="text-2xl font-bold text-[#142B6F] font-mono tracking-wider">
                  {bookingCode}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => setShowCelebration(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-[#142B6F] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#142B6F] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Let's Play! 🚀
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREDICTION CARD */}
      <div className="rounded-3xl shadow-lg overflow-hidden bg-gradient-to-br from-[#142B6F] to-[#1E3A8A] text-white border border-[#2D4BA8] hover:border-[#FFD601]/30 transition-all duration-300 hover:shadow-xl">
        {/* HEADER BAR - Updated for Free Tips */}
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
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="font-bold text-sm cursor-pointer"
                style={{ color: GOLD }}
                onClick={handleFreeClick}
              >
                {bookingCode || "FREE"}
              </motion.div>
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

        {/* MATCHES SCROLL AREA */}
        <div className="mt-4 bg-[#0F1E4D]/80 rounded-xl mx-6 p-4 max-h-60 overflow-y-auto border border-[#1b2e6a]">
          {(matchData || []).map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
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
            </motion.div>
          ))}

          {(!matchData || matchData.length === 0) && (
            <p className="text-xs text-[#AFC3FF] text-center py-4">
              No match data available.
            </p>
          )}
        </div>

        {/* BOOKING + BUTTON AREA */}
        <div className="px-6 pt-4 pb-6">
          <p className="text-xs text-[#AFC3FF] mb-3">
            {isFree ? (
              <>Click the golden code above to copy</>
            ) : (
              "Locked — purchase to reveal"
            )}
          </p>

          <motion.button
            onClick={isFree ? handleFreeClick : handleUnlock}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-2xl font-bold text-sm relative overflow-hidden"
            style={{
              backgroundColor: isFree ? "#1E3A8A" : GOLD,
              color: isFree ? GOLD : NAVY,
              border: isFree ? `2px solid ${GOLD}` : "none",
            }}
          >
            <span className="relative z-10">
              {isFree
                ? "🎁 Get Free Tip"
                : loading
                ? "Processing..."
                : `Unlock for ₵${Number(price).toLocaleString()}`}
            </span>
            {loading && (
              <motion.div
                className="absolute inset-0 bg-[#FFE769]"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}
