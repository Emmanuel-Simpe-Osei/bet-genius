// components/NewPredictionCard.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const GOLD = "#FFD601";
const NAVY = "#142B6F";

export default function NewPredictionCard({ game, isLoggedIn }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    // Not logged in → send to login
    if (!isLoggedIn) {
      router.push("/login?next=/predictions");
      return;
    }

    // ❗ CUSTOM → block purchase, show slot full
    if (isCustom) {
      toast.error("Slot full, please wait for the next game drop.");
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
  // HANDLE FREE COPY
  // ------------------------------------------------------------
  const handleFreeClick = () => {
    if (bookingCode) {
      navigator.clipboard
        ?.writeText(bookingCode)
        .then(() => toast.success("Booking code copied"))
        .catch(() => {});
    }
  };

  const formattedDate = gameDate
    ? new Date(gameDate).toLocaleDateString()
    : "N/A";

  const priceLabel = isFree ? "FREE" : `₵${Number(price).toLocaleString()}`;

  return (
    <div className="rounded-3xl shadow-lg overflow-hidden bg-[#142B6F] text-white">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center px-6 pt-5 pb-1">
        <div className="flex flex-col gap-1">
          <span className="uppercase text-sm tracking-wide font-bold">
            {title || "Free"}
          </span>
          <span className="text-xs text-[#AFC3FF]">
            Game Date: <span className="font-semibold">{formattedDate}</span>
          </span>
        </div>

        <div className="text-right">
          <span className="uppercase text-xs text-[#AFC3FF] block">Price</span>
          <span className="font-bold text-sm" style={{ color: GOLD }}>
            {priceLabel}
          </span>
          {totalOdds && (
            <span className="block text-[10px] text-[#AFC3FF] mt-1">
              Total Odds:{" "}
              <span className="font-semibold">
                {Number(totalOdds).toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* MATCHES SCROLL AREA */}
      <div className="mt-4 bg-[#0F1E4D] rounded-lg mx-6 p-4 max-h-60 overflow-y-auto">
        {(matchData || []).map((m, i) => (
          <div
            key={i}
            className="flex justify-between items-center border-b border-[#1b2e6a] py-2 last:border-b-0"
          >
            <div className="text-xs">
              <div className="font-medium">
                {m.homeTeam} vs {m.awayTeam}
              </div>
              <div className="text-[10px] text-[#AFC3FF]">
                {m.marketDesc || ""} • Odds {m.odds || "-"}
              </div>
            </div>
            <div className="text-[10px] font-semibold text-[#FFD601]">
              {m.status || ""}
            </div>
          </div>
        ))}

        {(!matchData || matchData.length === 0) && (
          <p className="text-xs text-[#AFC3FF]">No match data available.</p>
        )}
      </div>

      {/* BOOKING + BUTTON AREA */}
      <div className="px-6 pt-4 pb-6">
        {/* Booking text */}
        <p className="text-xs text-[#AFC3FF] mb-3">
          Booking:{" "}
          {isFree ? bookingCode || "Not set" : "Locked — purchase to reveal"}
        </p>

        {/* ACTION BUTTON */}
        <button
          onClick={isFree ? handleFreeClick : handleUnlock}
          disabled={loading}
          className="w-full py-3 rounded-full font-semibold text-sm"
          style={{
            backgroundColor: GOLD,
            color: NAVY,
            opacity: loading ? 0.75 : 1,
          }}
        >
          {isFree
            ? "Free Tip"
            : loading
            ? "Processing..."
            : `Unlock for ₵${Number(price).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
